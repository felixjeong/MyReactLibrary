var tape = require('tape')
var cosmic = require('./fixtures/cosmic')
var validator = require('../')
var validatorRequire = require('../require')

tape('simple', function(t) {
  var schema = {
    required: true,
    type: 'object',
    properties: {
      hello: {type:'string', required:true}
    }
  }

  var validate = validator(schema)

  t.ok(validate({hello: 'world'}), 'should be valid')
  t.notOk(validate(), 'should be invalid')
  t.notOk(validate({}), 'should be invalid')
  t.end()
})

tape('advanced', function(t) {
  var validate = validator(cosmic.schema)

  t.ok(validate(cosmic.valid), 'should be valid')
  t.notOk(validate(cosmic.invalid), 'should be invalid')
  t.end()
})

tape('greedy/false', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      x: {
        type: 'number'
      }
    },
    required: ['x', 'y']
  });
  t.notOk(validate({}), 'should be invalid')
  t.strictEqual(validate.errors.length, 2);
  t.strictEqual(validate.errors[0].field, 'data.x')
  t.strictEqual(validate.errors[0].message, 'is required')
  t.strictEqual(validate.errors[1].field, 'data.y')
  t.strictEqual(validate.errors[1].message, 'is required')
  t.notOk(validate({x: 'string'}), 'should be invalid')
  t.strictEqual(validate.errors.length, 1);
  t.strictEqual(validate.errors[0].field, 'data.y')
  t.strictEqual(validate.errors[0].message, 'is required')
  t.notOk(validate({x: 'string', y: 'value'}), 'should be invalid')
  t.strictEqual(validate.errors.length, 1);
  t.strictEqual(validate.errors[0].field, 'data.x')
  t.strictEqual(validate.errors[0].message, 'is the wrong type')
  t.end();
});

tape('greedy/true', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      x: {
        type: 'number'
      }
    },
    required: ['x', 'y']
  }, {
    greedy: true
  });
  t.notOk(validate({}), 'should be invalid')
  t.strictEqual(validate.errors.length, 2);
  t.strictEqual(validate.errors[0].field, 'data.x')
  t.strictEqual(validate.errors[0].message, 'is required')
  t.strictEqual(validate.errors[1].field, 'data.y')
  t.strictEqual(validate.errors[1].message, 'is required')
  t.notOk(validate({x: 'string'}), 'should be invalid')
  t.strictEqual(validate.errors.length, 2);
  t.strictEqual(validate.errors[0].field, 'data.y')
  t.strictEqual(validate.errors[0].message, 'is required')
  t.strictEqual(validate.errors[1].field, 'data.x')
  t.strictEqual(validate.errors[1].message, 'is the wrong type')
  t.notOk(validate({x: 'string', y: 'value'}), 'should be invalid')
  t.strictEqual(validate.errors.length, 1);
  t.strictEqual(validate.errors[0].field, 'data.x')
  t.strictEqual(validate.errors[0].message, 'is the wrong type')
  t.ok(validate({x: 1, y: 'value'}), 'should be invalid')
  t.end();
});

tape('additional props', function(t) {
  var validate = validator({
    type: 'object',
    additionalProperties: false
  }, {
    verbose: true
  })

  t.ok(validate({}))
  t.notOk(validate({foo:'bar'}))
  t.ok(validate.errors[0].value === 'data.foo', 'should output the property not allowed in verbose mode')
  t.end()
})

tape('array', function(t) {
  var validate = validator({
    type: 'array',
    required: true,
    items: {
      type: 'string'
    }
  })

  t.notOk(validate({}), 'wrong type')
  t.notOk(validate(), 'is required')
  t.ok(validate(['test']))
  t.end()
})

tape('nested array', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      list: {
        type: 'array',
        required: true,
        items: {
          type: 'string'
        }
      }
    }
  })

  t.notOk(validate({}), 'is required')
  t.ok(validate({list:['test']}))
  t.notOk(validate({list:[1]}))
  t.ok(validate.errors[0].field === 'data.list.0');
  t.notOk(validate({list:['test', 2]}))
  t.ok(validate.errors[0].field === 'data.list.1');
  t.end()
})

tape('enum', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'number',
        required: true,
        enum: [42]
      }
    }
  })

  t.notOk(validate({}), 'is required')
  t.ok(validate({foo:42}))
  t.notOk(validate({foo:43}))
  t.end()
})

tape('minimum/maximum', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'number',
        minimum: 0,
        maximum: 0
      }
    }
  })

  t.notOk(validate({foo:-42}))
  t.ok(validate({foo:0}))
  t.notOk(validate({foo:42}))
  t.end()
})

tape('exclusiveMinimum/exclusiveMaximum', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'number',
        minimum: 10,
        maximum: 20,
        exclusiveMinimum: true,
        exclusiveMaximum: true
      }
    }
  })

  t.notOk(validate({foo:10}))
  t.ok(validate({foo:11}))
  t.notOk(validate({foo:20}))
  t.ok(validate({foo:19}))
  t.end()
})

tape('allow to validate undefined as object', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      }
    },
    required: ['foo']
  }, {undefinedAsObject: true});

  t.notOk(validate(undefined));
  t.ok(validate.errors[0].field === 'data.foo');
  t.ok(validate.errors[0].message === 'is required');
  t.end();
});

tape('allow to validate null as object', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      }
    },
    required: ['foo']
  }, {nullAsObject: true});

  t.notOk(validate(null));
  t.ok(validate.errors[0].field === 'data.foo');
  t.ok(validate.errors[0].message === 'is required');
  t.end();
});

tape('allow to validate null and undefined as objects', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
      }
    },
    required: ['foo']
  }, {nullAsObject: true, undefinedAsObject: true});

  t.notOk(validate(null));
  t.ok(validate.errors[0].field === 'data.foo');
  t.ok(validate.errors[0].message === 'is required');

  t.notOk(validate(undefined));
  t.ok(validate.errors[0].field === 'data.foo');
  t.ok(validate.errors[0].message === 'is required');

  t.end();
});

tape('allow to validate undefined as array', function(t) {
  var validate = validator({
    type: 'array',
    minItems: 1
  }, {undefinedAsArray: true});

  t.notOk(validate(undefined));
  t.ok(validate.errors[0].field === 'data');
  t.ok(validate.errors[0].message === 'has less items than allowed');
  t.end();
});

tape('allow to validate null as object', function(t) {
  var validate = validator({
    type: 'array',
    minItems: 1
  }, {nullAsArray: true});

  t.notOk(validate(null));
  t.ok(validate.errors[0].field === 'data');
  t.ok(validate.errors[0].message === 'has less items than allowed');
  t.end();
});

tape('allow to validate null and undefined as objects', function(t) {
  var validate = validator({
    type: 'array',
    minItems: 1
  }, {nullAsArray: true, undefinedAsArray: true});

  t.notOk(validate(null));
  t.ok(validate.errors[0].field === 'data');
  t.ok(validate.errors[0].message === 'has less items than allowed');

  t.notOk(validate(undefined));
  t.ok(validate.errors[0].field === 'data');
  t.ok(validate.errors[0].message === 'has less items than allowed');

  t.end();
});

tape('custom format', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        format: 'as'
      }
    }
  }, {formats: {as:/^a+$/}})

  t.notOk(validate({foo:''}), 'not as')
  t.notOk(validate({foo:'b'}), 'not as')
  t.notOk(validate({foo:'aaab'}), 'not as')
  t.ok(validate({foo:'a'}), 'as')
  t.ok(validate({foo:'aaaaaa'}), 'as')
  t.end()
})

tape('custom format function', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        format: 'as'
      }
    }
  }, {formats: {as:function(s) { return /^a+$/.test(s) } }})

  t.notOk(validate({foo:''}), 'not as')
  t.notOk(validate({foo:'b'}), 'not as')
  t.notOk(validate({foo:'aaab'}), 'not as')
  t.ok(validate({foo:'a'}), 'as')
  t.ok(validate({foo:'aaaaaa'}), 'as')
  t.end()
})

tape('custom format function with custom error reporting', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        format: 'as'
      }
    }
  }, {
    formats: {
      as:function(s) {
        if (s !== 'as') {
          return 'custom error message'
        }
        return true;
      }
    }
  })

  t.notOk(validate({foo:''}), 'should be "as"')
  t.ok(validate.errors);
  t.ok(validate.errors[0]);
  t.ok(validate.errors[0].field === 'data.foo');
  t.ok(validate.errors[0].message === 'custom error message');
  t.end()
})

tape('custom format function accept current node as second argument', function(t) {
  var touchedNodes = [];
  var schema = {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        format: 'as'
      }
    }
  };
  var validate = validator(schema, {
    formats: {
      as:function(s, n) {
        touchedNodes.push(n);
        return s === 'as';
      }
    }
  })

  t.ok(validate({foo:'as'}), 'as')
  t.ok(touchedNodes[0] === schema.properties.foo);
  t.end()
})

tape('custom format function can be specified inline', function(t) {
  var validate = validator({
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        format: function(s) {
          return s === 'as';
        }
      }
    }
  });
  t.notOk(validate({foo:'s'}));
  t.ok(validate({foo:'as'}));
  t.end()
})

tape('do not mutate schema', function(t) {
  var sch = {
    items: [
      {}
    ],
    additionalItems: {
      type: 'integer'
    }
  }

  var copy = JSON.parse(JSON.stringify(sch))

  validator(sch)

  t.same(sch, copy, 'did not mutate')
  t.end()
})

tape('#toJSON()', function(t) {
  var schema = {
    required: true,
    type: 'object',
    properties: {
      hello: {type:'string', required:true}
    }
  }

  var validate = validator(schema)

  t.deepEqual(validate.toJSON(), schema, 'should return original schema')
  t.end()
})

tape('external schemas', function(t) {
  var ext = {type: 'string'}
  var schema = {
    required: true,
    $ref: '#ext'
  }

  var validate = validator(schema, {schemas: {ext:ext}})

  t.ok(validate('hello string'), 'is a string')
  t.notOk(validate(42), 'not a string')
  t.end()
})

tape('nested required array decl', function(t) {
  var schema = {
    properties: {
      x: {
        type: 'object',
        properties: {
          y: {
            type: 'object',
            properties: {
              z: {
                type: 'string'
              }
            },
            required: ['z']
          }
        }
      }
    },
    required: ['x']
  }

  var validate = validator(schema)

  t.ok(validate({x: {}}), 'should be valid')
  t.notOk(validate({}), 'should not be valid')
  t.strictEqual(validate.errors[0].field, 'data.x', 'should output the missing field')
  t.end()
})

tape('verbose mode', function(t) {
  var schema = {
    required: true,
    type: 'object',
    properties: {
      hello: {
        required: true,
        type: 'string'
      }
    }
  };

  var validate = validator(schema, {verbose: true})

  t.ok(validate({hello: 'string'}), 'should be valid')
  t.notOk(validate({hello: 100}), 'should not be valid')
  t.strictEqual(validate.errors[0].value, 100, 'error object should contain the invalid value')
  t.end()
})

tape('additional props in verbose mode', function(t) {
  var schema = {
    type: 'object',
    required: true,
    additionalProperties: false,
    properties: {
      foo: {
        type: 'string'
      },
      'hello world': {
        type: 'object',
        required: true,
        additionalProperties: false,
        properties: {
          foo: {
            type: 'string'
          }
        }
      }
    }
  };

  var validate = validator(schema, {verbose: true})

  validate({'hello world': {bar: 'string'}});

  t.strictEqual(validate.errors[0].value, 'data["hello world"].bar', 'should output the path to the additional prop in the error')
  t.end()
})

tape('Date.now() is an integer', function(t) {
  var schema = {type: 'integer'}
  var validate = validator(schema)

  t.ok(validate(Date.now()), 'is integer')
  t.end()
})
