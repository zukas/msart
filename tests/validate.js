var ObjectID 	= require('mongodb').ObjectID,
	check 	 	= require('../engine/validate');

var tests = [];

function TestCase(name, exec) {
	this.run = function (done) {
		exec(function(expected, result) { done(name, expected, result); });
	}
}

tests.push(new TestCase("Check string value type", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "String"
		};
		var data = "some string";
		var res = check.run(data, schema);

		end(true, res);
	}
));


tests.push(new TestCase("Check number value type", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "Number"
		};
		var data = 0;
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check object value type", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "Object"
		};
		var data = {};
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check array value type", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "Array",
		};
		var data = [];
		var res = check.run(data, schema);

		end(true, res);
	}
));


tests.push(new TestCase("Check string values 1", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "String",
			value : "one|two|something"
		};
		var data = "two";
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check string values 2", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "String",
			value : "one|two|something"
		};
		var data = "one";
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check string values 3", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "String",
			value : "one|two|something"
		};
		var data = "something";
		var res = check.run(data, schema);

		end(true, res);
	}
));


tests.push(new TestCase("Check number values 1", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "Number",
			value : "0|1|2|3"
		};
		var data = 0;
		var res = check.run(data, schema);

		end(true, res);
	}
));


tests.push(new TestCase("Check number values 2", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "Number",
			value : "0|1|2|3"
		};
		var data = 3;
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check number values 3", 
	function (end) {
		var schema = {
			type : check.TYPE.VALUE,
			class : "Number",
			value : "0|1|2|3"
		};
		var data = 2;
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check regex values 1", 
	function (end) {

		var id = new ObjectID().toString();
		var schema = {
			type : check.TYPE.VALUE,
			class : "String",
			regex : /[\w\d]{24}/
		};
		var res = check.run(id, schema);


		end(true, res);
	}
));

tests.push(new TestCase("Check regex values 2", 
	function (end) {

		var id = "544dasdasd46";
		var schema = {
			type : check.TYPE.VALUE,
			class : "String",
			regex : /[\w\d]{24}/
		};
		var res = check.run(id, schema);


		end(false, res);
	}
));

tests.push(new TestCase("Check regex values 3", 
	function (end) {
		check.installRegex("ObjectID", /[\w\d]{24}/);
		var id = new ObjectID().toString();
		var schema = {
			type : check.TYPE.VALUE,
			class : "String",
			regex : "$ObjectID"
		};
		var res = check.run(id, schema);


		end(true, res);
	}
));

tests.push(new TestCase("Check array values 1", 
	function (end) {
		check.installRegex("ObjectID", /[\w\d]{24}/);
		var id = new ObjectID().toString();
		var schema = {
			type : check.TYPE.ARRAY,
			members : {
				type : check.TYPE.VALUE,
				class : "String",
				regex : "$ObjectID"
			}
		};
		var res = check.run([id, id, id], schema);


		end(true, res);
	}
));

tests.push(new TestCase("Check array values 2", 
	function (end) {
		var data = [52, 45, 65, 22, 'a'];
		var schema = {
			type : check.TYPE.ARRAY,
			members : {
				type : check.TYPE.VALUE,
				class : "Number"
			}
		};
		var res = check.run(data, schema);


		end(false, res);
	}
));


tests.push(new TestCase("Check array values 3", 
	function (end) {
		var data = [{}, {}, {}, {}, {}];
		var schema = {
			type : check.TYPE.ARRAY,
			members : {
				type : check.TYPE.VALUE,
				class : "Object"
			}
		};
		var res = check.run(data, schema);


		end(true, res);
	}
));

tests.push(new TestCase("Check object values 1", 
	function (end) {
		var data = {
			fields: [ "hello" ]
		}
		var schema = {
			type : check.TYPE.OBJECT,
			properties: {
				fields: {
					type: check.TYPE.ARRAY,
					members: {
						type: check.TYPE.VALUE,
						class: "String"
					}
				}
			}
		};
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check object values 2", 
	function (end) {
		var data = {
		}
		var schema = {
			type : check.TYPE.OBJECT,
			properties: {
				fields: {
					type: check.TYPE.ARRAY,
					members: {
						type: check.TYPE.VALUE,
						class: "String"
					}
				}
			}
		};
		var res = check.run(data, schema);

		end(false, res);
	}
));

tests.push(new TestCase("Check object values 3", 
	function (end) {
		var data = {
			fields: []
		}
		var schema = {
			type : check.TYPE.OBJECT,
			properties: {
				fields: {
					type: check.TYPE.ARRAY,
					members: {
						type: check.TYPE.VALUE,
						class: "String"
					}
				}
			}
		};
		var res = check.run(data, schema);

		end(true, res);
	}
));

tests.push(new TestCase("Check object values 4", 
	function (end) {
		var data = null;
		var schema = {
			type : check.TYPE.OBJECT,
			properties: {
				fields: {
					type: check.TYPE.ARRAY,
					members: {
						type: check.TYPE.VALUE,
						class: "String"
					}
				}
			}
		};
		var res = check.run(data, schema);

		end(false, res);
	}
));


tests.push(new TestCase("Check large object", 
	function (end) {
		check.installRegex("ObjectID", /[\w\d]{24}/);
		var data = {
			id : new ObjectID().toString(),
			title: "Best item",
			type: 0,
			price: {
				type : 1,
				priceList: [
					{
						quantity: 20,
						price: 100,
						shipping: 75
					},
					{
						quantity: 50,
						price: 200,
						shipping: 115
					},
				]
			}
		}
		var schema = {
			type : check.TYPE.OBJECT,
			properties : {
				id: {
					type: check.TYPE.VALUE,
					class: "String",
					regex: "$ObjectID"
				},
				title : {
					type: check.TYPE.VALUE,
					class: "String"
				},
				type: {
					type: check.TYPE.VALUE,
					class: "Number",
					value: "0|1|2"
				},
				price: {
					type: check.TYPE.OBJECT,
					properties: {
						type: {
							type: check.TYPE.VALUE,
							class: "Number",
							value: "0|1"
						},
						priceList: {
							type: check.TYPE.ARRAY,
							members: {
								type: check.TYPE.OBJECT,
								properties: {
									quantity: {
										type: check.TYPE.VALUE,
										class: "Number"
									},
									price: {
										type: check.TYPE.VALUE,
										class: "Number"
									},
									shipping: {
										type: check.TYPE.VALUE,
										class: "Number"
									},
								}
							}
						}
					}
				}
			}
		};
		var res = check.run(data, schema);


		end(true, res);
	}
));


exports.test = function () {
	function run_test(idx, tests_a) {
		if(idx < tests_a.length) {
			tests_a[idx].run(function (name, expected, result) {
				console.log(result.status == expected ? "PASS" : "FAILD", name, result.error || "");
				setTimeout(run_test, 0, idx+1, tests_a);
			});
		} else {
			console.log("END");
		}
	}

	run_test(0, tests);
}