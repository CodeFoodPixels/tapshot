'use strict';

const path = require(`path`);
const fs = require(`fs`);
const callsites = require(`callsites`);
const isPlainObj = require(`is-plain-obj`);
const mkdirp = require(`mkdirp`);
const prettyFormat = require(`pretty-format`);

class tapshot {
    constructor(options = {}) {
        if (!isPlainObj(options)) {
            throw new Error(`options must be an object`);
        }

        this.file = options.file;
        this.update = options.update;

        return this.tapshot.bind(this);
    }

    tapshot (tap, found, options = {}) {
        if (typeof tap !== `object` && typeof tap !== `function`) {
            throw new Error(`tap must either be an object or a function`);
        }
        if (typeof tap.equal !== `function`) {
            throw new Error(`tap must have the 'equal' assertion method`);
        }
        if (typeof tap.pass !== `function`) {
            throw new Error(`tap must have the 'pass' assertion method`);
        }
        if (!isPlainObj(options)) {
            throw new Error(`options must be an object`);
        }

        const name = options.name || tap.name;
        const callee = callsites()[1].getFileName();
        const file = `${path.dirname(callee)}/${(options.file || this.file || `snapshots/${path.basename(callee)}.snap`)}`;

        if (typeof name !== `string` || name.length === 0) {
            throw new Error(`No name provided, either use this within a named test or set options.name`);
        }

        let serializedFound;

        if (options.serializer) {
            if (typeof options.serializer === `string`) {
                if (found[options.serializer] && typeof found[options.serializer] !== `function`) {
                    throw new Error(`Method '${options.serializer}' does not exist on provided object`);
                }

                serializedFound = found[options.serializer]();
            } else if (typeof options.serializer === `function`) {
                serializedFound = options.serializer(found);
            } else {
                throw new Error(`Serializer provided to options.serializer must be a funtion or a string with the name of the serializer to be called on the object`);
            }

            if (typeof serializedFound !== `string`) {
                throw new Error(`Serializer provided to options.serializer must produce a string`);
            }
        } else {
            serializedFound = prettyFormat(found);
        }

        let snapshots;

        try {
            snapshots = this.loadSnapshot(file);
        } catch (err) {
            if (err.code !== `ENOENT`) {
                throw new Error(`Error when loading and parsing the snapshot file at '${file}'. Error given: ${err}`);
            }

            if (!options.update && !this.update) {
                throw new Error(`The snapshot file '${file}' does not exist, which means the snapshot is probably new. Run the test with the 'update' flag passed to save the snapshot.`);
            }
        }

        if (snapshots && !snapshots[name] && !options.update && !this.update) {
            throw new Error(`The snapshot for '${name}' does not exist in the file '${file}', which means the snapshot is probably new. Run the test with the 'update' flag passed to save the snapshot.`);
        }

        if (options.update || this.update) {
            if (!snapshots) {
                snapshots = {};
            }
            snapshots[name] = serializedFound;

            this.saveSnapshot(snapshots, file);

            return tap.pass(`Snapshot for ${name} has been updated`);
        }

        tap.equal(serializedFound, snapshots[name], `Snapshot does not match for ${name}`);
    }

    loadSnapshot(file) {
        const snapshot = {
            exports: Object.create(null)
        };

        const snapshotData = fs.readFileSync(file, `utf8`);

        const build = new Function(`module`, snapshotData);

        build(snapshot);

        return snapshot.exports;
    }

    saveSnapshot(data, file) {
        try {
            data = Object.keys(data).map((key, index) => {
                return `module.exports[${this.formatAsTemplateString(key)}] = ${this.formatAsTemplateString(data[key])};`;
            })

            data = data.join(`\n\n`);

            try {
                fs.accessSync(path.dirname(file), fs.constants.F_OK);
            } catch (err) {
                mkdirp.sync(path.dirname(file));
            }

            fs.writeFileSync(file, data);
        } catch (err) {
            throw new Error(`Error when trying to save the snapshot. Error given: ${err}`);
        }

    }

    formatAsTemplateString(string) {
        return `\`${string.replace(/`|\${|\\/g, `\\$&`)}\``;
    }
}

const instance = new tapshot();

instance.configure = (config) => {
    return new tapshot(config);
}

module.exports = instance;
