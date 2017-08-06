var User   = require('../models').User;
var async  = require('async');
var topic_passed = require('./topic_passed');


exports.login          = login;                  // 站内登陆
exports.createUser     = createUser;             // 创建用户
exports.edit           = edit;                   // 修改用户资料
exports.getUserById    = getUserById;            // 通过 id 获取用户
exports.getUserByName  = getUserByName;          // 通过 用户名 获取用户
exports.getUserByToken = getUserByToken;         // 通过 token 获取用户
exports.getUserTopicByName = getUserTopicByName; // 通过 用户名 获取发的帖子

function getUserById (id, callback, open) {
	getUser({_id: id}, callback, open);
}

function getUserByToken (token, callback, open) {
	getUser({token: token}, callback, open);
}

function getUserByName (name, callback, open) {
	getUser({loginname: name}, callback, open);
}

function getUserTopicByName (option, callback) {
	var author = {};
	async.waterfall([
		function (callback) {
			getUserByName(option.name, callback);
		},
		function (user, callback) {
			author = user[0];
			option.condition = {author_id: author._id};
			topic_passed.getTopic(option, callback);
		}
	], function (err, item) {
		if (err) return callback(err, item);
		item.topic.author = author;
		callback(err, item);
	});
}

function getUser (condition, callback, open) {
	var fields = {};
	// 传入 真 为获取所有信息
	if (open !== true) {
		fields = openFields;
	}
	User.find(condition, fields, function (err, user) {
		if (err) return callback(err, null);

		for (var i = 0; i < user.length; i++) {
			user[i].avatar = user[i].fullAvatar;
		}
		callback(null, user);
	});
}

function createUser (data, callback) {
	User.create(data, function (err, result) {
		if (err) return callback({ states: -3, hint: '用户名已存在'});
		return callback({ states: 1, 'hint': '成功' });
	});
}

function login (data, callback) {
	User.find(data, function (err, result) {
		if (err) return callback(null, { states: -4, hint: '服务器繁忙!'});
		if (result < 1) return  callback(null, { states: -4, hint: '账号或密码错误'});

		var token = User.createToken();
		User.update(data, {$set: {token: token}}, function (err, result){
			if (err) return next(err);
			return callback(token, { states: 1, hint: '成功'});
		});
	});
}

function edit (condition, data, callback) {
	User.update(condition, {$set: data}, function (err, result) {
		if (err) return callback({ states: -1, hint  : '服务器错误' });

		return callback({ states: 1, hint  : '更新成功' });
	});
}

var openFields = {
	loginname: 1,
	description: 1,
	avatar: 1,
	email: 1,
	qq: 1,
	wb: 1,
	topic_count: 1,
	reply_count: 1
};