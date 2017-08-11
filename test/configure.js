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
    t.throws(
        () => {
            tapshot.configure(`badger`);
        },
        `options must be an object`
    );
    t.end();
});

tap.test(`throws when options is an array`, (t) => {
    t.throws(
        () => {
            tapshot.configure([]);
        },
        `options must be an object`
    );
    t.end();
});

tap.test(`runs when file is overridden in configure`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    const instance = tapshot.configure({file:`snapshots/badger.snap`});

    instance(tMock, {mockData: "this is fake data"});

    t.ok(proxies.fs.readFileSync.calledWith(`${__dirname}/snapshots/badger.snap`));
    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`updates the snapshot if the update option is passed as true`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    const instance = tapshot.configure({update: true});

    instance(tMock, {mockData: "this is updated fake data"});

    t.ok(proxies.fs.writeFileSync.calledOnce)
    t.ok(proxies.fs.writeFileSync.calledWith(`${__dirname}/snapshots/configure.js.snap`, updateFixtureCode));

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

    const instance = tapshot.configure({update: false});

    instance(tMock, {mockData: "this is updated fake data"});

    t.ok(proxies.fs.writeFileSync.notCalled)

    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});
