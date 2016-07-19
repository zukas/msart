"use strict";


var schema_type = {
	VALUE : 0,
	ARRAY : 1,
	OBJECT : 2
};


var installed_regex = {};
var installed_validators = {};
var installed_converters = {};
var installed_modifiers = {};


function classOf(value) {
    return /\[object (\w+)\]/.exec(Object.prototype.toString.call(value))[1];
}

exports.classOf = classOf;

function convert (from_type, to_type, value) {
	var converter = (installed_converters[from_type] || {})[to_type];
	if(converter) {
		return converter(value);
	} else {
		return null;
	}
}

function check_validate (data, schema) {
	var res = { status: false };
	if(schema) {
		switch(schema.type) {
			case 0 : {
				res = val_value(data, schema);
				break;
			}  
			case 1 : {
				res = val_array(data, schema);
				break;
			}
			case 2 : {
				res = val_object(data, schema);
				break;
			}
		}
	}
	return res;
}

function val_array(data, schema) {
	if(schema && schema.type == schema_type.ARRAY) {
		if(classOf(data) == "Array") {
			var pass 	= true,
				parsed 	= [],
				errors 	= [];

			for(var i = 0; i < data.length; ++i) {
				var res = check_validate(data[i], schema.members);
				if(res.status) {
					parsed.push(res.data);
				} else {
					pass = false;
					errors.push(res.error);
				}
			}

			if(pass) {
				if(schema.minLength && schema.minLength > parsed.length) {
					return { status: false, error : "Array does not have enough items" };
				} else {
					return { status: true, data : parsed };
				}
			} else {
				return { status: false, error : errors };
			}
		} else if(data == null && schema.optional) {
			return { status : true };
		}
	}
	return { status: false };
}

function val_object(data, schema) {
	if(schema && schema.type == schema_type.OBJECT) {
		if(classOf(data) == "Object") {
			var pass 	= true,
				parsed 	= {},
				errors 	= {},
				keys 	= Object.keys(schema.properties);
			for(var i = 0; i < keys.length; ++i) {
				var prop 	= keys[i],
					val 	= data[prop];

				var res = check_validate(val, schema.properties[prop]);
				if(res.status) {
					parsed[prop] = res.data;
				} else {
					errors[prop] = res.error;
					pass = false;
				}
			}
			if(pass) {
				return { status: true , data: parsed };
			} else {
				return { status: false , error: errors };
			}
		} else if(data == null && schema.optional) {
			return { status : true };
		}
	}
	return { status: false };	
}

function val_value(data, schema) {
	if(schema && schema.type == schema_type.VALUE) {
		if(schema.optional && !data) {
			return { status : true };
		}

		if(classOf(data) == "String") {
			data = data.trim();
		}

		if(schema.class) {
			var pass = classOf(data) == schema.class;
			if(!pass && schema.convert) {
				var tmp = convert(classOf(data), schema.class, data);
				pass = (classOf(tmp) == schema.class);
				if(pass) {
					data = tmp;
				}
			}
			if(!pass) {
				return { status : false, error : "Invalid data type" };
			}
		}

		if(schema.value) {
			var vals = schema.value.split("|"),
				pass = false;
			for(var i = 0; i < vals.length && !pass; ++i) {
				pass = (data == vals[i]);
			}
			if(!pass) {
				return { status : false, error : "Invalid data value" };
			}
		}

		if(schema.regex) {
			if(classOf(schema.regex) == "String") {
				var tmp = installed_regex[schema.regex];
				if(tmp) {
					schema.regex = tmp;
				}
			}
			if(!((classOf(schema.regex) == "RegExp") && schema.regex.test(data))) {
				return { status : false, error : "Invalid data value" };
			}
		}
		if(schema.custom) {
			if(classOf(schema.custom) == "String") {
				var func = installed_validators[schema.custom];
				if(func) {
					schema.custom = func;
				}
			}
			if(!((classOf(schema.custom) == "Function") && schema.custom(data))) {
				return { status : false, error : "Invalid data value" };
			}
		}

		if(schema.mod) {
			if(classOf(schema.mod) == "Array") {
				for(var i = 0; i < schema.mod.length; ++i) {
					if(classOf(schema.mod[i]) == "String") {
						var func = installed_modifiers[schema.mod[i]];
						if(func) {
							schema.mod[i] = func;
						}
					}
					if(classOf(schema.mod[i]) == "Function") {
						data = schema.mod[i](data);
					}
				}
			} else {
				if(classOf(schema.mod) == "String") {
					var func = installed_modifiers[schema.mod];
					if(func) {
						schema.mod = func;
					}
				}
				if(classOf(schema.mod) == "Function") {
					data = schema.mod(data);
				}
			}
		}

		return { status: true, data: data };
	}
	return { status: false };
}

exports.TYPE = schema_type;



exports.installRegex = function (key, regex) {
	if(classOf(key) == "String" && 
		classOf(regex) == "RegExp") {
		installed_regex["$" + key] = regex;
	}
}

exports.installValidator = function (key, func) {
	if(classOf(key) == "String" && 
		classOf(func) == "Function") {
		installed_validators["$" + key] = func;
	}
}	

exports.installMod = function (key, func) {
	if(classOf(key) == "String" && 
		classOf(func) == "Function") {
		installed_modifiers["$" + key] = func;
	}
}

exports.installConverter = function (from_type, to_type, func) {
	if(classOf(from_type) == "String" && 
		classOf(to_type) == "String" && 
		classOf(func) == "Function") {
		installed_converters[from_type] = installed_converters[from_type] || {};
		installed_converters[from_type][to_type] = func;
	}
}

exports.run = function (data, schema) {
	return check_validate(data, schema);
}



