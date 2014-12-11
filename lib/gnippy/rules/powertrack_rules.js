var _             = require('underscore');
var EventEmitter  = require('events').EventEmitter;
var http          = require('request');
var util          = require('util');

var RulesManager  = function(options){
  var that        = this;
  that.options    = _.extend({platform: 'twitter'}, options);

  EventEmitter.call(that);

  var uri               = _.template("https://api.gnip.com:443/accounts/<%- account_name %>/publishers/<%- platform %>/streams/track/<%- stream_name %>/rules.json", that.options);
  that.request_options  =  {
    uri:        uri,
    auth:       {
      user:     options.user,
      pass:     options.password
    },
    gzip:       true,
    headers:    {
      "Content-Type":  "application/json"
    }
  };

  that._req     = null;
};
util.inherits(RulesManager, EventEmitter);

RulesManager.prototype.add  = function(new_rules, next){
  var that      = this;

  if(_.isEmpty(that.options.account_name)){
    throw new Error('You must include a Gnip account name.');
  }

  if(_.isEmpty(_.compact([that.options.user, that.options.password]))){
    throw new Error('Missing account credentials.');
  }

	var batch_size = this.options.batch_size || 1000;

  	if( new_rules.length >= batch_size)
	{
		var old_next = next;
		var remaining_rules = new_rules.slice(batch_size);
		new_rules = new_rules.slice(0, batch_size);
		next = function(err, is_successful)
		{
			if(err)
			{
				if(old_next)
				{
					old_next(err);
				}
				else
				{
					this.emit("error", err);
				}
			}
			else
			{
				if(this.options.debug) util.log("add: batch complete " + new_rules.length + "/" + remaining_rules.length);
				this.add(remaining_rules, old_next);
			}
		}.bind(this);
	}

  var rq_options  = _.extend(that.request_options, {
    method: 'POST',
    json:   {
      "rules":  _.flatten([new_rules])
    }
  });

  that._req   = http(rq_options);
  that._req.on("error", function(err)
	{
		if(next)
		{
			next(err);
		}
		else
		{
			this.emit("error", err.message);
		}
	}.bind(this));
  that._req.on('response', function(res){
    if(that.options.debug){
      util.log(res.statusCode);
      if (res.body) {
        util.log(res.body);
      }
    }
    if(res.statusCode >= 200 && res.statusCode <= 299){
		if(next) 
		{
			next(null, true);
		}
      	else 
		{
			that.emit('success', true);
		}
    }else if(res.statusCode === 413) {
      	if(next)
		{
			next('Your request is too large, try breaking your requests into smaller chunks.')
		}
		else
		{
			that.emit('request_too_large', 'Your request is too large, try breaking your requests into smaller chunks.');
			that.emit('error', 'Your request is too large, try breaking your requests into smaller chunks.');
		}
    }else if(res.statusCode === 422){
		if(next)
		{
			next('Your rule is invalid. Response Code: '+res.statusCode+'; Message: '+res.body);
		}
		else
		{
			that.emit('unprocessable_entity', 'Your rule is invalid. Message: '+res.body);
			that.emit('error', 'Your rule is invalid. Response Code: '+res.statusCode+'; Message: '+res.body);
		}
    }else{
		if(next)
		{
			next('New rules could not be added. Response Code: '+res.statusCode);
		}
		else
		{
			that.emit('error', 'New rules could not be added. Response Code: '+res.statusCode);
		}
    }
  });
};

RulesManager.prototype.list = function(next){
  var that      = this;

  if(_.isEmpty(that.options.account_name)){
    throw new Error('You must include a Gnip account name.');
  }

  if(_.isEmpty(_.compact([that.options.user, that.options.password]))){
    throw new Error('Missing account credentials.');
  }

  var rq_options  = _.omit(_.extend(that.request_options, { method: 'GET' }),'headers');

  http(rq_options, function(error, res, body){
    if(that.options.debug){
      util.log(res.statusCode);
      if(body){
        util.log(JSON.parse(body));
      }
    }
    if(res.statusCode >= 200 && res.statusCode <= 299){
		if(next)
		{
			next(null, body ? JSON.parse(body) : []);
		}
		else
		{
			that.emit('success', body ? JSON.parse(body) : []);
		}
    }else{
		if(next)
		{
			next({code: res.statusCode, message: 'Rules could not be listed. Response Code: '+res.statusCode}, []);
		}
		else
		{
			that.emit('error', {code: res.statusCode, message: 'Rules could not be listed. Response Code: '+res.statusCode});
		}
    }
  });
};

RulesManager.prototype.remove  = function(rules_to_delete, next){
  var that      = this;

  if(_.isEmpty(that.options.account_name)){
    throw new Error('You must include a Gnip account name.');
  }

  if(_.isEmpty(_.compact([that.options.user, that.options.password]))){
    throw new Error('Missing account credentials.');
  }

	var batch_size = this.options.batch_size || 1000;

  	if( rules_to_delete.length >= batch_size)
	{
		var old_next = next;
		var remaining_rules = rules_to_delete.slice(batch_size);
		rules_to_delete = rules_to_delete.slice(0, batch_size);
		next = function(err, is_successful)
		{
			if(err)
			{
				if(old_next)
				{
					old_next(err);
				}
				else
				{
					this.emit("error", err);
				}
			}
			else
			{
				if(this.options.debug) util.log("remove: batch complete " + rules_to_delete.length + "/" + remaining_rules.length);
				this.remove(remaining_rules, old_next);
			}
			
		}.bind(this);
	}

  var rq_options  = _.extend(that.request_options, {
    method: 'DELETE',
    json:   {
      "rules":  _.flatten([rules_to_delete])
    }
  });

  that._req   = http(rq_options);
  that._req.on('response', function(res){
    if(that.options.debug){
      util.log(res.statusCode);
      if(res.body){
        util.log(res.body);
      }
    }
    if(res.statusCode >= 200 && res.statusCode <= 299){
		if(next)
		{
			next(null, true);
		}
		else
		{
			that.emit('success', true);
		}
    }else{
		if(next)
		{
			next({code: res.statusCode, message: 'Rules could not be removed. Response Code: '+res.statusCode});
		}
		else
		{
			that.emit('error', {code: res.statusCode, message: 'Rules could not be removed. Response Code: '+res.statusCode});
		}
    }
  });
};

module.exports  = RulesManager;