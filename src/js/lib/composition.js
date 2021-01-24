// Class for creating multi inheritance.
class LibComposition
{
	// Inherit method to create base classes.
	static inherit(..._bases)
	{
		class classes {

			// The base classes
  			get base() { return _bases; }

			constructor(..._args)
			{
				let index = 0;

				for (let b of this.base) 
				{
					let obj = new b(_args[index++]);
                    LibComposition.copy(this, obj);
				}
			}
		
		}

		// Copy over properties and methods
		for (let base of _bases) 
		{
            LibComposition.copy(classes, base);
            LibComposition.copy(classes.prototype, base.prototype);
		}

		return classes;
	}

	// Copies the properties from one class to another
	static copy(_target, _source) 
	{
    		for (let key of Reflect.ownKeys(_source)) 
			{
        		if (key !== "constructor" && key !== "prototype" && key !== "name") 
				{
	        	    let desc = Object.getOwnPropertyDescriptor(_source, key);
	        	    Object.defineProperty(_target, key, desc);
        		}
    		}
	}
}

module.exports = LibComposition;


/**
 * 
 example:


class ages
{
	constructor(_age) {	this.age = _age; }
	set age(_a) { this._age = _a; }
	get age() { return this._age; }
	increase() { this.age++; }
}

class genders
{
	constructor(_gender) { this.gender = _gender; }
	set gender(_g) { this._gender = _g; }
	get gender() { return this._gender; }
	male() { this._gender = 'M'; }
	female() { this._gender = 'F'; }
}

class person extends Urso.Game.Lib.Composition.inherit(ages, genders)
{
	constructor(...args)
	{
		super(18, 'M');
		this.name = args[0];
	}

	set name(_n) { this._name = _n; }
	get name() { return this._name; }
}

let p = new person('Adam');
console.log(p.name, p.age, p.gender);

*/
