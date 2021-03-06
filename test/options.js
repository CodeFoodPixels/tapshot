'use strict';

const tap = require(`tap`);
const proxyquire = require(`proxyquire`);
const fs = require(`fs`);
const sinon = require(`sinon`);

const fixture = fs.readFileSync(`${__dirname}/fixtures/basic.js`, `utf8`);
const updateFixtureCode = fs.readFileSync(`${__dirname}/fixtures/update.js`, `utf8`);

const proxies = {
    fs: {
        writeFileSync: sinon.stub(),
        accessSync: sinon.stub(),
        readFileSync: sinon.stub().returns(fixture)
    },
    mkdirp: {
        sync: sinon.stub()
    },
}

const tapshot = proxyquire(`../index.js`, proxies);

tap.beforeEach((done) => {
    proxies.fs.readFileSync.resetHistory();
    proxies.fs.writeFileSync.reset();

    done();
});

tap.test(`throws when options isn't an object`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"}, `badger`)
        },
        `options must be an object`
    );
    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when options is an array`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"}, [])
        },
        `options must be an object`
    );
    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`runs when tap.name isn't defined but is defined in options`, (t) => {
    const tMock = {
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is fake data"}, {name:`pass`})

    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when tap.name is undefined and options.name is an empty string`, (t) => {
    const tMock = {
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"}, {name:``})
        },
        `No name provided, either use this within a named test or set options.name`
    );
    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`runs when file is overridden in options`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is fake data"}, {file:`snapshots/badger.snap`})

    t.ok(proxies.fs.readFileSync.calledWith(`${__dirname}/snapshots/badger.snap`));
    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`runs when serializer is passed as a function in options`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    const serializerStub = sinon.stub().callsFake((object) => {
        return JSON.stringify(object);
    });

    tapshot(tMock, {mockData: "this is fake data"}, {serializer: serializerStub});

    t.ok(serializerStub.calledOnce);
    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});


tap.test(`runs when serializer is passed as a string in options`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    const obj = {
        serialize: sinon.stub().callsFake(() => {
            return JSON.stringify({mockData: "this is fake data"});
        })
    }

    tapshot(tMock, obj, {serializer: 'serialize'});

    t.ok(obj.serialize.calledOnce);
    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`throws when serializer is not passed as a string or function in options`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"}, {serializer: [`fail`]})
        },
        `Serializer provided to options.serializer must be a funtion or a string with the name of the serializer to be called on the object`
    );

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when serializer specified as string does not exist on the object`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"}, {serializer: `badger`})
        },
        `Method 'badger' does not exist on provided object`
    );

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when serializer specified as string is on the object but is not a function`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data", badger: true}, {serializer: `badger`})
        },
        `Method 'badger' does not exist on provided object`
    );

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when serializer does not produce a string`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"}, {serializer: () => {
                return {badger: true};
            }})
        },
        `Serializer provided to options.serializer must produce a string`
    );

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`updates the snapshot if the update option is passed as true`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is updated fake data"}, {update: true})

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`${__dirname}/snapshots/options.js.snap`, updateFixtureCode));

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot for pass has been updated`));
    t.end();
});

tap.test(`doesn't update the snapshot if the update option is passed as false`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is updated fake data"}, {update: false})

    t.ok(proxies.fs.writeFileSync.notCalled)

    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});
