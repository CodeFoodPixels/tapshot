'use strict';

const tap = require(`tap`);
const proxyquire = require(`proxyquire`);
const fs = require(`fs`);
const sinon = require(`sinon`);

const fixture = require(`${__dirname}/fixtures/basic.js`);
const fixtureCode = fs.readFileSync(`${__dirname}/fixtures/basic.js`, `utf8`);

const addFixtureCode = fs.readFileSync(`${__dirname}/fixtures/addSnapshot.js`, `utf8`);
const saveFailFixtureCode = fs.readFileSync(`${__dirname}/fixtures/saveFail.js`, `utf8`);
const updateFixtureCode = fs.readFileSync(`${__dirname}/fixtures/update.js`, `utf8`);

const proxies = {
    fs: {
        writeFileSync: sinon.stub(),
        accessSync: sinon.stub(),
    },
    mkdirp: {
        sync: sinon.stub()
    },
    'import-fresh': sinon.stub()
}

const tapshot = proxyquire(`../index.js`, proxies);

tap.beforeEach((done) => {
    proxies['import-fresh'].reset();
    proxies['import-fresh'].returns(Object.assign({}, fixture));

    proxies.fs.accessSync.reset();

    proxies.fs.writeFileSync.reset();

    proxies.mkdirp.sync.reset();

    process.env.UPDATE_SNAPSHOTS = false;

    done();
});

tap.test(`creates snapshot file and passes when it doesn't exist`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies['import-fresh'].throws({code: `MODULE_NOT_FOUND`});

    tapshot(tMock, {mockData: "this is fake data"})

    t.ok(proxies['import-fresh'].calledOnce)
    t.ok(proxies['import-fresh'].calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, fixtureCode));

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

    proxies['import-fresh'].throws({code: `MODULE_NOT_FOUND`});
    proxies.fs.accessSync.throws(`nope`);

    tapshot(tMock, {mockData: "this is fake data"})

    t.ok(proxies['import-fresh'].calledOnce)
    t.ok(proxies['import-fresh'].calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, fixtureCode));

    t.ok(proxies.mkdirp.sync.calledOnce);
    t.ok(proxies.mkdirp.sync.calledWith(`snapshots`));

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot file did not exist. Created it at snapshots/files.js.snap`));
    t.end();
});

tap.test(`adds snapshot to file if it doesn't exist`, (t) => {
    const tMock = {
        name: `pass2`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is more fake data"})

    t.ok(proxies['import-fresh'].calledOnce)
    t.ok(proxies['import-fresh'].calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, addFixtureCode));

    t.ok(proxies.mkdirp.sync.notCalled);

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot for pass2 did not exist in the file 'snapshots/files.js.snap'. It has been added.`));
    t.end();
});

tap.test(`throws if there's an error in the snapshot`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies['import-fresh'].throws(`error!`);

    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        `Error when loading and parsing the snapshot file at 'snapshots/files.js.snap'. Error given: error!`
    );

    t.ok(proxies['import-fresh'].calledOnce)
    t.ok(proxies['import-fresh'].calledWith(`snapshots/files.js.snap`));

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws if there's an error writing the snapshot file`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.writeFileSync.throws(`error!`);

    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data that should fail"})
        },
        `Error when trying to save the snapshot. Error given: error!`
    );

    t.ok(proxies['import-fresh'].calledOnce);
    t.ok(proxies['import-fresh'].calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, saveFailFixtureCode));

    t.ok(proxies.mkdirp.sync.notCalled)

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

    process.env.UPDATE_SNAPSHOTS = true;

    tapshot(tMock, {mockData: "this is updated fake data"})

    t.ok(proxies['import-fresh'].calledOnce)
    t.ok(proxies['import-fresh'].calledWith(`snapshots/files.js.snap`));

    t.ok(proxies.fs.accessSync.calledOnce)
    t.ok(proxies.fs.accessSync.calledWith(`snapshots`));

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`snapshots/files.js.snap`, updateFixtureCode));

    t.ok(proxies.mkdirp.sync.notCalled)

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot for pass has been updated`));
    t.end();
});