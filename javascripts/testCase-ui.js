var ApiTestCaseViewController = Spine.Controller.create({
	apiTestCase : null,
	init : function(){
		alert("fda");
		this.apiTestCase = SwaggerService.TestCase();
		apiTestCase.bind("refresh", this.addAll);
	},

	container : "#resources_container_case",
	liCase	  : "#resourcesCase",

	
//	$('.add').click(function(){
//		var id = $(this).find('a').attr("class");
//		this.addApiItem(id);
//	});
	
	
	addApiItem : function(id){
		 var apiItem = Api.find(id);
		 if(apiItem != null){
			 this.renderApi(apiItem);
		 }
		 
	},
	addAll : function(){
		
		$(this.container).html("");
		this.apiTestCase.each(this.addOne);
		$(this.container).slideDown('slow');
	},
	
	
	addOne : function(testCaseItem){
		$(this.liCase).append($('#testcaseTmpl').tmpl(testCaseItem));
		this.addApiList(testCaseItem.apiList);
	},
	
	addApiList : function(apiList){
		apiList.each(this.renderApi);
	},
	
	
	renderApi : function(apiItem){
		var resourcesApisContainer = "#" + this.apiTestCase.name + "_endpoint_list";
		ApiController.init({
			item : apiItem, 
			container : resourcesApisContainer
		});
	}
});


$(function(){
	ApiTestCaseViewController.init();
});