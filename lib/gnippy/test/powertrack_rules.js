var should = require('should'),
	Gnippy = require("gnippy");

describe("powertrack rules", function()
{
	this.timeout(10000);
	
	var GnipRules = null;
	
	before(function()
	{
		GnipRules = new Gnippy.Powertrack.Rules({
			account_name: "<your Gnip account name>",
			user:         "<your Gnip user name>",
			password:     "<your Gnip password>",
			stream_name:  "<your Gnip Powertrack Stream name, ex. 'prod'>"
			batch_size: 1,
			debug: true
		});
	})
	
	it("should add a rule", function(done)
	{
		should.exist(GnipRules);
		global.test_rule = {value:"TEST" + Date.now()};
		GnipRules.add(global.test_rule, function(err, is_successful)
		{
			should.not.exist(err);
			should.exist(is_successful);
			
			done();
		});
	});
	
	it("should delete a rule", function(done)
	{
		should.exist(GnipRules);
		global.should.have.property("test_rule");
		
		var rules_to_delete = [global.test_rule];
		rules_to_delete.push({value: "IDONTEXIST"});
		
		GnipRules.remove(rules_to_delete, function(err, is_successful)
		{
			should.not.exist(err);
			should.exist(is_successful);
			
			done();
		});
	});
	
	it("should add 2 rules in 2 batches", function(done)
	{
		should.exist(GnipRules);
		global.test_rules = [{value:"TEST" + Date.now()}, {value:"TEST2" + Date.now()}];
		GnipRules.add(global.test_rules, function(err, is_successful)
		{
			should.not.exist(err);
			should.exist(is_successful);
			
			done();
		});
	})
	
	it("should add 2 rules in 2 batches", function(done)
	{
		should.exist(GnipRules);
		global.should.have.property("test_rules");
		GnipRules.remove(global.test_rules, function(err, is_successful)
		{
			should.not.exist(err);
			should.exist(is_successful);
			
			done();
		});
	})
});