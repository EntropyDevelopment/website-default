/*	Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const koa = require('koa');
const logger = require('koa-logger');
const forward = require('koa-forward-request');
const route = require('koa-route');
const http = require('http');

const config = require('config')(require('./config.js'));

const app = new koa();

forward(app, {
	debug: (process.env.NODE_ENV !== 'production')	// 2017-04-23 AMR NOTE: don't debug for now due to trashy output format
});

const index = async (ctx, next) => {
	console.log('asdf2');
	console.log(ctx.forwards);

	await next();

	ctx.forward(ctx.forwards['static'].forward + '/index.html');
};

var server;

app.use(logger());
app.use(async (ctx, next) => {
	await next();

	for(const f in ctx.forwards) {
		if(ctx.request.url.startsWith(ctx.forwards[f].path)) {
			// 2017-04-24 AMR NOTE: don't allow continuing into later middleware
			ctx.forward(ctx.forwards[f].forward + ctx.request.url.replace(ctx.forwards[f].path, ""));
		}
	}
});
app.use(route.get('/', async (ctx) => {
	ctx.forward(ctx.forwards['static'].forward + 'default.html');
}));

config.onReady(function() {
	app.context.forwards = config.forward;

	server = app.listen(config.port);
});

config.onChange(function() {
	server.close(function() {
		server = app.listen(config.port);
	});
});
