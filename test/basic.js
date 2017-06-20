'use strict';

const tap = require(`tap`);
const proxyquire = require(`proxyquire`);
const fs = require(`fs`);
const sinon = require(`sinon`);

const fixture = require(`${__dirname}/fixtures/basic.js`);

const proxies = {
    'import-fresh': sinon.stub().returns(fixture)
}

const tapshot = proxyquire(`../index.js`, proxies);

tap.beforeEach((done) => {
    proxies['import-fresh'].resetHistory();
    done();
});

tap.test(`run with defaults`, (t) => {
    const tMock = {
        name: `pass`,
        equal: sinon.spy(),
        pass: sinon.spy()
    };

    tapshot(tMock, {mockData: "this is fake data"});

    t.ok(proxies['import-fresh'].calledOnce);
    t.ok(proxies['import-fresh'].calledWith(`snapshots/basic.js.snap`));
    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`run with defaults and tap as a function`, (t) => {
    const tMock = new (function() {
        this.name = `pass`;
        this.equal = sinon.spy();
        this.pass = sinon.spy();
    })();

    tapshot(tMock, {mockData: "this is fake data"});

    t.ok(proxies['import-fresh'].calledOnce);
    t.ok(proxies['import-fresh'].calledWith(`snapshots/basic.js.snap`));
    t.ok(tMock.equal.calledOnce);
    t.ok(tMock.pass.notCalled);

    t.end();
});

tap.test(`throws when tap isn't an object or function`, (t) => {
    t.throws(
        () => {
            tapshot('badger', {mockData: "this is fake data"})
        },
        `tap must either be an object or a function`
    );
    t.end();
});

tap.test(`throws when tap.equal isn't a function`, (t) => {
    const tMock = {
        name: `fail`,
        equal: `badger`,
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        `tap must have the 'equal' assertion method`
    );
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when tap.pass isn't a function`, (t) => {
    const tMock = {
        name: `fail`,
        equal: sinon.spy(),
        pass: `badger`
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        `tap must have the 'pass' assertion method`
    );
    t.ok(tMock.equal.notCalled);
    t.end();
});

tap.test(`throws when tap.name isn't a string`, (t) => {
    const tMock = {
        name: [`fail`],
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        `No name provided, either use this within a named test or set options.name`
    );
    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

tap.test(`throws when tap.name is an empty string`, (t) => {
    const tMock = {
        name: ``,
        equal: sinon.spy(),
        pass: sinon.spy()
    };
    t.throws(
        () => {
            tapshot(tMock, {mockData: "this is fake data"})
        },
        `No name provided, either use this within a named test or set options.name`
    );
    t.ok(tMock.equal.notCalled);
    t.ok(tMock.pass.notCalled);
    t.end();
});

