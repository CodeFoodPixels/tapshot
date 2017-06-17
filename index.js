'use strict';

const assert = require(`assert`);
const path = require(`path`);
const fs = require(`fs`);
const callsites = require(`callsites`);
const mkdirp = require(`mkdirp`);
const prettyFormat = require(`pretty-format`);

function saveSnapshot(data, file) {
    try {
        data = JSON.stringify(data, null, '    ');

        try {
            fs.accessSync(path.dirname(file), fs.constants.F_OK);
        } catch (err) {
            mkdirp.sync(path.dirname(file));
        }

        fs.writeFileSync(file, data);
    } catch (err) {
        throw `Error when trying to save the snapshot. Error given: ${err}`
    }
}

module.exports = function tapshot(tap, found, options = {}) {
    assert.ok(
        typeof tap === `object` || typeof tap === `function`,
        `tap must either be an object or a function`
    );
    assert.ok(
        typeof tap.equal === `function`,
        `tap must have the 'equal' assertion method`
    );
    assert.ok(
        typeof tap.pass === `function`,
        `tap must have the 'pass' assertion method`
    );
    assert.ok(
        typeof options === `object`,
        `options must be an object`
    );

    const name = options.name || tap.name;
    const file = options.file || `snapshots/${path.basename(callsites()[1].getFileName())}.snap`;

    assert.ok(
        typeof name === `string` && name.length > 0,
        `No name provided, either use this within a named test or set options.name`
    );

    let serializedFound;

    if (options.serializer) {
        if (typeof options.serializer === `string`) {
            assert.ok(
                found[options.serializer] && typeof value[options.serializer] === `function`,
                `Method '${options.serializer}' does not exist on provided object`
            );

            serializedFound = found[options.serializer]();
        } else if (typeof options.serializer === `function`) {
            serializedFound = options.serializer(found);
        } else {
            throw `Serializer provided to options.serializer must be a funtion or a string with the name of the serializer to be called on the object`;
        }

        assert.ok(
            typeof serializedFound === `string`,
            `Serializer provided to options.serializer must produce a string`
        );
    } else {
        serializedFound = prettyFormat(found);
    }

    let snapshots;

    try {
        snapshots = JSON.parse(fs.readFileSync(file, `utf8`));
    } catch (err) {
        if (err.code === 'ENOENT') {
            saveSnapshot({[name]: serializedFound}, file);

            return tap.pass(`Snapshot file did not exist. Created it at ${file}`);
        }

        throw `Error when loading and parsing the snapshot file at '${file}'. Error given: ${err}`
    }

    if (!snapshots[name]) {
        snapshots[name] = serializedFound;

        saveSnapshot(snapshots, file);

        return tap.pass(`Snapshot for ${name} did not exist in the file '${file}'. It has been added.`);
    }

    if (process.env.UPDATE_SNAPSHOTS) {
        snapshots[name] = serializedFound;

        saveSnapshot(snapshots, file);

        return tap.pass(`Snapshot for ${name} has been updated`);
    }

    tap.equal(serializedFound, snapshots[name], `Snapshot does not match for ${name}`);
}

