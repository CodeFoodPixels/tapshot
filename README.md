# tapshot

[![Build Status](https://travis-ci.org/lukeb-uk/tapshot.svg?branch=master)](https://travis-ci.org/lukeb-uk/tapshot)

Tapshot is a helper module for snapshot testing when you are using tools like [tap](https://www.npmjs.com/package/tap) and [tape](https://www.npmjs.com/package/tape). Tapshot can be used to test any serializable object.

## Install
```
$ npm install --save-dev tapshot
```

## Usage
Tapshot will automatically create snapshot files and pass the test if they do not already exist. Similarly if you add a new test, the snapshot will be added to the file and the test will pass.

### Updating Snapshots
If you change the structure of the object being snapshotted, you will need to update your snapshots. To do this you need to set the `UPDATE_SNAPSHOTS` environment variable before running the tests. In the case of `tap test/*.js` being the test command, you can do it like so:

```
$ UPDATE_SNAPSHOTS=true tap test/*.js
```

Be warned that this will update all of your snapshots, so any snapshot tests that are failing due to unwanted breakages will now pass.

### API

#### tapshot(tap, object[, options])
- `tap` _object_ or _function_: A tap class that has the `equal` and `pass` methods. If you're not setting `name` in `options`, this also needs to contain a name, which will be provided if you use it within a named subtest
- `object` _any_: The object that you want to snapshot. This can be any serializable object. If it is a non-standard object, a `serializer` must be provided in `options`.
- `options` _object_: The options to run the test with. These are all optional:
    + `name` _string_: The name for the snapshot
    + `file` _string_: The location of the snapshot file you wish to use
    + `serializer` _string_ or _function_: The serializer for the object provided if it is a non-standard object. If passed as a string, it will call that method on the object, if passed as a function, the funtion will be called with the object as the only argument.

## Examples

```js
const tap = require(`tap`);
const tapshot = require(`tapshot`);

tap.test(`Generated code is as expected` (t) => {
    tapshot(t, `console.log('this is a string of text')`);
    t.end();
});
```

```js
const tap = require(`tap`);
const tapshot = require(`tapshot`);

tap.test(`Generated code is as expected` (t) => {
    tapshot(t, `console.log('this is a string of text')`, {name: 'generated-code'});
    t.end();
});
```

## License
MIT © Luke Bonaccorsi