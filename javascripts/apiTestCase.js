//
//
//var ApiTestCase = Spine.Model.setup("ApiTestCase", ["name", "listApi"]);
//ApiTestCase.include({
//	init : function(atts){
//		if(atts) this.load(atts);
//		
//	}
//});
//
//
////
////
////
////var ApiItem = Spine.Model.sub();
////ApiItem.configure("ApiItem", "path", "name");
////ApiItem.extend(Spine.Model.Local);
////
////var ApiTestCase = Spine.Model.sub();
////ApiTestCase.configure("ApiTestCase", "name");
////ApiTestCase.extend(Spine.Model.Local);
////
////var ForeignTable = Spine.Model.sub();
////ForeignTable.configure("ForeignTable", "test_case_id", "api_item_id");
////ForeignTable.extend(Spine.Model.Local);
////
////
//ApiTestCase.extend({
//	getListTestCase : function(){
//		this.all();
//	},
//
//	destroyAllTestCase : function(){
//		this.each(function(item){
//			item.destroy();
//			ForeignTable.destroyByTestCaseForeign(item.id);
//		});
//	}
//    
//});
////
////
////ForeignTable.extend({
////	getListItemByTestCase : function(testCaseId){
////		this.select(function(item){
////			if(item.test_case_id == testCaseId) return item;
////		});
////	},
////
////	destroyByTestCaseForeign : function(testCaseId){
////		var foreignRecords = this.getListItemByTestCase(testCaseId);
////		foreignRecords.each(function(item){
////			item.destroy();
////		});
////	}
////
////});
////
////
////
//var TestCaseControl = Spine.Controller.sub({
//	
//	elements : {
//		".itemList" : "itemList",
//		"#resourcesCase" : "itemCase",
//		".testcaseName" : "itemName"
//	},
//
//	events : {
//		"click  .addnew" : "create"
//	},
//	
//	init :function(){
//		ApiTestCase.bind("refresh", this.proxy(this.addAll));
//		ApiTestCase.bind("create", this.proxy(this.addOne));
//		ApiTestCase.fetch();
//	},
//	
//	create : function(){
//		
//		var name = this.itemName.val();
// 		this.itemName.val("");
//// 		ApiTestCase.create({name:name});
//		var testCase = new ApiTestCase({name : name});
//		testCase.save();
//		
////		this.itemCase.append($('#testcaseTmpl').tmpl(testCase));
//	},
//	
//	addAll : function(){
//		var items = ApiTestCase.all();
////		alert(items);	
////		alert(ApiTestCase);
////		items.each(this.proxy(this.addOne));
//		ApiTestCase.each(this.proxy(this.addOne));
//	},
//	
//	addOne : function(item){
//		
//		this.itemCase.append($('#testcaseTmpl').tmpl(item));
//	}
//});
//
//
//$(function(){
//	return new TestCaseControl({
//		el : $('#resources_container_case')
//	});
//});
////
////


var ApiTestCase = Spine.Model.setup("ApiTestCase", ["name", "apiList"]);
ApiTestCase.include({
	inint : function(atts){
		if(atts) this.load(atts);
		this.name = testcaseName;
		this.apiList = Api.sub();
	},

	addApi : function(apiItem){
		if(apiItem != null){
			this.apiList.create(apiItem);
		}
	},
	
	addApis : function(listApis){
		if(listApis != null){
			this.apiList = listApis;
		}
	},
	
	destroyAllApi : function(){
		this.apiList = null;
	}
});

this.TestCase = function(){
	ApiTestCaseController.init();
}


var ApiTestCaseController = Spine.Controller.create({
	
	proxied : ["loadTestCaseList", "addTestCase", "getListApiByTestCase"],
	
	init : function(){
		this.loadTestCaseList();
	},
	
	getListApiByTestCase : function(testCaseItem){
		if(testCaseItem != null){
			$.getJSON("get list api by testcase",
				function(res){
					testCaseItem.apiList = res.apiList;
				}
			);
		}
		
	},
	
	loadTestCaseList : function(){
		var controller = this;
		$.getJSON("get list testcase", 
			function(res){
				ApiTestCase.createAll(res.testCases);
				controller.fecthList();
			}
		);
		ApiTestCase.trigger("refresh");
	},
	
	
	fetchList : function(){
		var testCaseList = ApiTestCase.all();
		for(var i = 0;i < testCaseList.length; i++){
			var testCaseItem = testCaseList[i];
			this.getListApiByTestCase(testCaseItem);
		}
	},
	
	addTestCase : function(testCaseItem){
		$.postJSON("add testcase",
			function(res){
				ApiTestCase.create(testCaseItem);
			}
		);
	},
	
	addApiItem : function(apiItem, apiTestCase){
		$.postJSON("add api item",
			function(){
				apiTestCase.addApi(apiItem);
			}
		);
	},
	
	removeApiTestCase : function(id){
		var testCaseItem = ApiTestCase.find(id);
		if(testCaseItem != null){
			testCaseItem.destroy();
		}
	}
});























