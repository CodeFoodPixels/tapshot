'use strict';

const tap = require(`tap`);
const proxyquire = require(`proxyquire`);
const fs = require(`fs`);
const sinon = require(`sinon`);

const fixture = fs.readFileSync(`${__dirname}/fixtures/basic.js`, `utf8`);

const addFixtureCode = fs.readFileSync(`${__dirname}/fixtures/addSnapshot.js`, `utf8`);
const saveFailFixtureCode = fs.readFileSync(`${__dirname}/fixtures/saveFail.js`, `utf8`);
const updateFixtureCode = fs.readFileSync(`${__dirname}/fixtures/update.js`, `utf8`);

const proxies = {
    fs: {
        writeFileSync: sinon.stub(),
        accessSync: sinon.stub(),
        readFileSync: sinon.stub()
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

    proxies.mkdirp.sync.reset();

    done();
});

tap.test(`throws when snapshot file doesn't exist`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.throws({code: `ENOENT`});

    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        {message:`The snapshot file '${__dirname}/snapshots/files.js.snap' does not exist, which means the snapshot is probably new. Run the test with the 'update' flag passed to save the snapshot.`}
    );

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`creates snapshot file and passes when it doesn't exist when update is passed`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.throws({code: `ENOENT`});

    tapshot(tMock, {mockData: "this is fake data"}, {update: true})

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`${__dirname}/snapshots/files.js.snap`, fixture));

    t.ok(proxies.mkdirp.sync.notCalled)

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);

    t.ok(tMock.pass.calledWith(`Snapshot for pass has been updated`));
    t.end();
});

tap.test(`creates snapshot file, directories and passes when they don't exist and update is passed`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.throws({code: `ENOENT`});
    proxies.fs.accessSync.throws(`nope`);

    tapshot(tMock, {mockData: "this is fake data"}, {update: true})

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`${__dirname}/snapshots/files.js.snap`, fixture));

    t.ok(proxies.mkdirp.sync.calledOnce);
    t.ok(proxies.mkdirp.sync.calledWith(`${__dirname}/snapshots`));

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot for pass has been updated`));
    t.end();
});

tap.test(`throws if snapshot isn't in the file`, (t) => {
    const tMock = {
        name: `pass2`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is more fake data"})
        },
        {message:`The snapshot for 'pass2' does not exist in the file '${__dirname}/snapshots/files.js.snap', which means the snapshot is probably new. Run the test with the 'update' flag passed to save the snapshot.`}

    );

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`adds snapshot to file if it doesn't exist and update is passed`, (t) => {
    const tMock = {
        name: `pass2`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is more fake data"}, {update: true})

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`${__dirname}/snapshots/files.js.snap`, addFixtureCode));

    t.ok(proxies.mkdirp.sync.notCalled);

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.calledOnce);
    t.ok(tMock.pass.calledWith(`Snapshot for pass2 has been updated`));
    t.end();
});

tap.test(`throws if there's an error in the snapshot`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    proxies.fs.readFileSync.throws(`error!`);

    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        {message:`Error when loading and parsing the snapshot file at '${__dirname}/snapshots/files.js.snap'. Error given: error!`}
    );

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
            tapshot(tMock, {mockData: "this is fake data that should fail"}, {update: true});
        },
        {message:`Error when trying to save the snapshot. Error given: error!`}
    );

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`${__dirname}/snapshots/files.js.snap`, saveFailFixtureCode));

    t.ok(proxies.mkdirp.sync.notCalled)

    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});
