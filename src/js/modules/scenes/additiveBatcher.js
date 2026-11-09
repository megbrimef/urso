/*
 * ADDED: 'add' and 'normal' blended elements in one draw call. In a slot almost every batch
 * break is a blend switch: a glow (add) under a body (normal), a glint over it (add), and so on for every symbol.
 * Textures are premultiplied, so the normal blend (ONE, ONE_MINUS_SRC_ALPHA) of a pixel with alpha 0 is
 * dst + src.rgb, which is the add blend (ONE, ONE) for the colour. So the batcher takes an add element as normal
 * and marks its vertices (bit 2 of aTextureIdAndRound.x, beside roundPixels in bit 1); the shader writes alpha 0
 * there. Draw order is untouched, the picture is the same; only the alpha written to the target differs (an opaque
 * canvas: nothing to see). Not for textures without premultiplied alpha: there the trick does not hold, and such
 * elements keep their own batch.
 *
 * Opt-in: Urso.config.renderer.additiveBatching (`?addBatch=0` turns it off). Relies on PIXI v8 batcher internals
 * (BatcherPipe._batchersByInstructionSet, checked against 8.18 and 8.22) — re-check on a PIXI upgrade.
 */
const ADD = 2;

let registered = false;

const isAdd = el => el.blendMode === 'add' && el.texture?._source?.alphaMode !== 'no-premultiply-alpha';

// the 6th float of each vertex: textureId << 16 | roundPixels
function markAdd(uint32View, index, vertices) {
    for (let i = 0; i < vertices; i++)
        uint32View[index + i * 6 + 5] |= ADD;
}

// the texture batch bit with roundPixels in bit 1 only, plus the add flag
function textureBits(maxTextures) {
    const gl = PIXI.generateTextureBatchBitGl(maxTextures);
    const gpu = PIXI.generateTextureBatchBit(maxTextures);

    return {
        gl: {
            ...gl,
            vertex: {
                header: `${gl.vertex.header}\nout float vAdd;\n`,
                main: `${gl.vertex.main}\nvAdd = step(1.5, aTextureIdAndRound.x);\n`,
                end: `
                    if (mod(aTextureIdAndRound.x, 2.) == 1.)
                    {
                        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
                    }
                `,
            },
            fragment: { ...gl.fragment, header: `${gl.fragment.header}\nin float vAdd;\n`, end: 'finalColor.a *= 1. - vAdd;' },
        },
        gpu: {
            ...gpu,
            vertex: {
                header: `${gpu.vertex.header}\n@out @interpolate(flat) vAdd: f32;\n`,
                main: `${gpu.vertex.main}\nvAdd = f32((aTextureIdAndRound.x >> 1u) & 1u);\n`,
                end: `
                    if((aTextureIdAndRound.x & 1u) == 1u)
                    {
                        vPosition = vec4<f32>(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
                    }
                `,
            },
            fragment: { ...gpu.fragment, header: `${gpu.fragment.header}\n@in @interpolate(flat) vAdd: f32;\n`, end: 'finalColor.a *= 1. - vAdd;' },
        },
    };
}

// the classes extend PIXI's, so they are made once PIXI is there, not when this module is imported
function createBatcherClass() {
    class AdditiveShader extends PIXI.Shader {
        constructor(maxTextures) {
            const bits = textureBits(maxTextures);

            super({
                glProgram: PIXI.compileHighShaderGlProgram({ name: 'batch-add', bits: [PIXI.colorBitGl, bits.gl, PIXI.roundPixelsBitGl] }),
                gpuProgram: PIXI.compileHighShaderGpuProgram({ name: 'batch-add', bits: [PIXI.colorBit, bits.gpu, PIXI.roundPixelsBit] }),
                resources: { batchSamplers: PIXI.getBatchSamplersUniformGroup(maxTextures) },
            });

            this.maxTextures = maxTextures;
        }
    }

    let shader = null;

    return class AdditiveBatcher extends PIXI.DefaultBatcher {
        static extension = { type: [PIXI.ExtensionType.Batcher], name: 'default' };

        constructor(options) {
            super(options);
            this._updateMaxTextures(options.maxTextures);
        }

        _updateMaxTextures(maxTextures) {
            if (shader?.maxTextures !== maxTextures)
                shader = new AdditiveShader(maxTextures);

            this.shader = shader;
        }

        // the batcher sees an add element as normal while it builds the batches, and the element keeps the mark
        // for the packing of later frames (updateElement)
        break(instructionSet) {
            const els = this._elements;
            const swapped = [];

            for (let i = this.elementStart; i < this.elementSize; i++) {
                const el = els[i];
                el._add = isAdd(el);

                if (!el._add)
                    continue;

                // spine slots keep the blend in a field, sprites and meshes read it through a getter
                const own = Object.prototype.hasOwnProperty.call(el, 'blendMode');

                if (own)
                    el.blendMode = 'normal';
                else
                    Object.defineProperty(el, 'blendMode', { value: 'normal', configurable: true, writable: true });

                swapped.push(el, own);
            }

            super.break(instructionSet);

            for (let i = 0; i < swapped.length; i += 2) {
                if (swapped[i + 1])
                    swapped[i].blendMode = 'add';
                else
                    delete swapped[i].blendMode;
            }
        }

        packAttributes(element, float32View, uint32View, index, textureId) {
            super.packAttributes(element, float32View, uint32View, index, textureId);

            if (element._add)
                markAdd(uint32View, index, element.attributeSize);
        }

        packQuadAttributes(element, float32View, uint32View, index, textureId) {
            super.packQuadAttributes(element, float32View, uint32View, index, textureId);

            if (element._add)
                markAdd(uint32View, index, 4);
        }
    };
}

class ModulesScenesAdditiveBatcher {
    constructor() {
        this.singleton = true;
    }

    /**
     * replace PIXI's default batcher; call before the renderer draws (pixiWrapper.init does). Once per page.
     * @returns {Boolean} false when PIXI lacks the internals it needs
     */
    register() {
        if (registered)
            return true;

        const needed = ['DefaultBatcher', 'BatcherPipe', 'Shader', 'generateTextureBatchBitGl', 'generateTextureBatchBit',
            'compileHighShaderGlProgram', 'compileHighShaderGpuProgram', 'getBatchSamplersUniformGroup',
            'colorBit', 'colorBitGl', 'roundPixelsBit', 'roundPixelsBitGl'];
        const missing = needed.filter(name => !PIXI[name]);

        if (missing.length) {
            Urso.logger.warn('ModulesScenesAdditiveBatcher: PIXI lacks', missing.join(', '), '- additive batching is off');
            return false;
        }

        const AdditiveBatcher = createBatcherClass();
        PIXI.extensions.add(AdditiveBatcher);

        // BatcherPipe makes each instruction set's 'default' batcher itself (new DefaultBatcher), past the
        // extension map, which serves only the batchers it makes later by name
        const buildStart = PIXI.BatcherPipe.prototype.buildStart;

        PIXI.BatcherPipe.prototype.buildStart = function (instructionSet) {
            const map = this._batchersByInstructionSet;

            if (!map[instructionSet.uid]) {
                map[instructionSet.uid] = Object.create(null);
                map[instructionSet.uid].default = new AdditiveBatcher({ maxTextures: this.renderer.limits.maxBatchableTextures });
            }

            return buildStart.call(this, instructionSet);
        };

        registered = true;
        return true;
    }
}

export default ModulesScenesAdditiveBatcher;
