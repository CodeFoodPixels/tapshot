'use strict';

const tap = require(`tap`);
const proxyquire = require(`proxyquire`);
const fs = require(`fs`);
const sinon = require(`sinon`);

const fixture = fs.readFileSync(`${__dirname}/fixtures/basic.json`, `utf8`);

const proxies = {
    fs: {
        readFileSync: sinon.stub(),
        writeFileSync: sinon.stub(),
        accessSync: sinon.stub(),
    },
    mkdirp: {
        sync: sinon.stub()
    }
}

const tapshot = proxyquire(`../index.js`, proxies);

tap.beforeEach((done) => {
    proxies.fs.readFileSync.reset();
    proxies.fs.readFileSync.returns(fixture);

    proxies.fs.accessSync.reset();

    proxies.fs.writeFileSync.reset();

    done();
});

tap.test(`throws when file isn't JSON`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.returns('this is a string');

    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        `options must be an object`
    );

    t.ok(proxies.fs.readFileSync.calledOnce)
    t.ok(proxies.fs.readFileSync.calledWith(`snapshots/files.js.snap`))
    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`creates snapshot file and passes when it doesn't exist`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.throws({code: `ENOENT`});

    tapshot(tMock, {mockData: "this is fake data"})

    t.ok(proxies.fs.readFileSync.calledOnce)
    t.ok(proxies.fs.readFileSync.calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.same(proxies.fs.writeFileSync.args[0][1], fixture);
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, fixture));

    t.ok(proxies.mkdirp.sync.notCalled)

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot file did not exist. Created it at snapshots/files.js.snap`));
    t.end();
});

tap.test(`creates snapshot file, directories and passes when they don't exist`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.throws({code: `ENOENT`});
    proxies.fs.accessSync.throws(`nope`);

    tapshot(tMock, {mockData: "this is fake data"})

    t.ok(proxies.fs.readFileSync.calledOnce)
    t.ok(proxies.fs.readFileSync.calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, fixture));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, fixture));

    t.ok(proxies.mkdirp.sync.calledOnce);
    t.ok(proxies.mkdirp.sync.calledWith(`snapshots`));

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot file did not exist. Created it at snapshots/files.js.snap`));
    t.end();
});
