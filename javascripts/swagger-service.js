function SwaggerService(baseUrl, _apiKey, statusCallback) {
  if (!baseUrl)
  throw new Error("baseUrl must be passed while creating SwaggerService");

  // constants
  baseUrl = jQuery.trim(baseUrl);
  if (baseUrl.length == 0)
  throw new Error("baseUrl must be passed while creating SwaggerService");

  if (! (baseUrl.toLowerCase().indexOf("http:") == 0 || baseUrl.toLowerCase().indexOf("https:") == 0)) {
    baseUrl = ("http://" + baseUrl);
  }

  var apiHost = baseUrl
  var statusListener = statusCallback;
  var apiKey = _apiKey;

  var apiKeySuffix = "";
  if (apiKey) {
    apiKey = jQuery.trim(apiKey);
    if (apiKey.length > 0)
    apiKeySuffix = "?api_key=" + apiKey;
  }
  
  function log(m) {
    if (window.console) console.log(m);
  }

  function error(m) {
    if (window.console) console.log("ERROR: " + m);
  }

  function updateStatus(status) {
    statusListener(status);
  }

  // make some models public
  this.ApiResource = function() {
    return ApiResource;
  };
	
  this.Api = function() {
    return Api;
  };

  this.apiHost = function() {
    return apiHost;
  };

  // Model: ApiResource
  var ApiResource = Spine.Model.setup("ApiResource", ["fetch_url","name", "baseUrl", "path", "description", "apiLists", "modelList"]);
//  ApiResource.extend(Spine.Model.Filter);
//  ApiResource.selectAttributes = ["name"];
  ApiResource.include({
    init: function(atts) {
      if (atts) this.load(atts);
      
      this.baseUrl = apiHost;
      this.fetch_url = this.baseUrl +this.path + "/list_api" + apiKeySuffix;
      
      //execluded 9 letters to remove .{format} from name
      this.name = this.path.substr(1, this.path.length - 1);
      this.apiList = Api.sub();
      this.modelList = ApiModel.sub();
      
    },

    addApis: function(apiObjects) {
      if (apiObjects != null)
    	  this.apiList.createAll(apiObjects);
    },

    addModel: function(modelObject) {
      this.modelList.create(modelObject);
    },

    toString: function() {
      return this.name + ": " + this.description;
    }
  });
  
  ApiResource.extend({
  	filter : function(item, query) {
  		if (query != null || query!="") {
			if (item.name.indexOf(query) > -1)
				return item;
			else return null;
  		} else {
  			return item;
  		}
  	}
  });
  
  // Model: Api
  var Api = Spine.Model.setup("Api", ["baseUrl", "path", "name", "description", "operations"]);
  Api.include({
    init: function(atts) {
      if (atts) this.load(atts);

      this.baseUrl = apiHost;

      var secondPathSeperatorIndex = this.path.indexOf("/", 1);
      if (secondPathSeperatorIndex > 0) {
        var prefix = this.path.substr(0, secondPathSeperatorIndex);
        var suffix = this.path.substr(secondPathSeperatorIndex, this.path.length);
        // log(this.path + ":: " + prefix + "..." + suffix);
        this.path_json = prefix.replace(".{format}", "") + suffix;
        this.path_xml = prefix.replace("{format}", "xml") + suffix;;

        if (this.path.indexOf("/") == 0) {
          this.name = this.path.substr(1, secondPathSeperatorIndex - 1);
        } else {
          this.name = this.path.substr(0, secondPathSeperatorIndex - 1);
        }
      } else {
        this.path_json = this.path.replace("{format}", "");
        this.path_xml = this.path.replace("{format}", "xml");

        if (this.path.indexOf("/") == 0) {
          this.name = this.path.substr(1, this.path.length - 1);
        } else {
          this.name = this.path.substr(0, this.path.length - 1);
        }
      }

      var value = this.operations;

      this.operations = ApiOperation.sub();
      if (value) {
        for (var i = 0; i < value.length; i++) {
          var obj = value[i];
          obj.apiName = this.name;
          obj.path = this.resPath + this.path;
          obj.path_json = this.resPath + this.path_json;
          obj.path_xml = this.resPath + this.path_xml;

        }

        this.operations.refresh(value);
      }

      updateStatus("Loading " + this.path + "...");

    },

    toString: function() {
      var opsString = "";
      for (var i = 0; i < this.operations.all().length; i++) {
        var e = this.operations.all()[i];

        if (opsString.length > 0)
        opsString += ", ";

        opsString += e.toString();
      }
      return this.path_json + "- " + this.operations.all().length + " operations: " + opsString;
    }

  });
  
  Api.extend({
  	filter : function(item, query) {
  		if (query != null || query!="") {
			if (item.name.indexOf(query) > -1)
				return item;
			else return null;
  		} else {
  			return item;
  		}
  	}
  });

  // Model: ApiOperation
  var ApiOperation = Spine.Model.setup("ApiOperation", ["baseUrl", "resPath", "path", "summary", "notes", "deprecated", "open", "httpMethod", "httpMethodLowercase", "nickname", "responseClass", "parameters", "apiName"]);
  ApiOperation.include({
    init: function(atts) {
      if (atts) this.load(atts);

      this.baseUrl = apiHost;
      this.httpMethodLowercase = this.httpMethod.toLowerCase();

      var value = this.parameters;
      this.parameters = ApiParameter.sub();
      if (value) this.parameters.refresh(value);
    },

    toString: function() {
      var paramsString = "(";
      for (var i = 0; i < this.parameters.all().length; i++) {
        var e = this.parameters.all()[i];

        if (paramsString.length > 1)
        paramsString += ", ";

        paramsString += e.toString();
      }
      paramsString += ")";

      return "{" + this.path_json + "| " + this.nickname + paramsString + ": " + this.summary + "}";
    },

    invocationUrl: function(formValues) {
      var formValuesMap = new Object();
      for (var i = 0; i < formValues.length; i++) {
        var formValue = formValues[i];
        if (formValue.value && jQuery.trim(formValue.value).length > 0)
        formValuesMap[formValue.name] = formValue.value;
      }

      var urlTemplateText = this.path_json.split("{").join("${");
      // log("url template = " + urlTemplateText);
      var urlTemplate = $.template(null, urlTemplateText);
      var url = $.tmpl(urlTemplate, formValuesMap)[0].data;
      // log("url with path params = " + url);

      var queryParams = apiKeySuffix;
      this.parameters.each(function(param) {
        var paramValue = jQuery.trim(formValuesMap[param.name]);
        if (param.paramType == "query" && paramValue.length > 0) {
          queryParams += queryParams.length > 0 ? "&": "?";
          queryParams += param.name;
          queryParams += "=";
          queryParams += formValuesMap[param.name];
        }
      });
      
      

      url = this.baseUrl + url + queryParams;
      // log("final url with query params and base url = " + url);

      return url;
    },
    
    invocationPostParam: function(formValues) {
        var formValuesMap = new Object();
        for (var i = 0; i < formValues.length; i++) {
          var formValue = formValues[i];
          if (formValue.value && jQuery.trim(formValue.value).length > 0)
          formValuesMap[formValue.name] = formValue.value;
        }

        var postParam = "";
        this.parameters.each(function(param) {
          var paramValue = jQuery.trim(formValuesMap[param.name]);
          if (param.paramType == "body" && paramValue.length > 0) {
        	 postParam = postParam.length > 0 ? postParam : "{";
        	 postParam += "\"" + param.name + "\"";
        	 postParam += ":";
        	 postParam += "\"" + formValuesMap[param.name] + "\",";
          }
        });
        
        if(postParam.length > 0){
        	postParam = postParam.substring(0, postParam.length - 1) + "}";
        }
        
        return postParam;
      }

  });

  // Model: ApiParameter
  var ApiParameter = Spine.Model.setup("ApiParameter", ["name", "description", "required", "dataType", "allowableValues", "paramType", "allowMultiple"]);
  ApiParameter.include({
    init: function(atts) {
      if (atts) this.load(atts);

      this.name = this.name || this.dataType;
    },

    toString: function() {
      if (this.allowableValues && this.allowableValues.length > 0)
      return this.name + ": " + this.dataType + " [" + this.allowableValues + "]";
      else
      return this.name + ": " + this.dataType;
    }

  });

  // Model: ApiModel
  var ApiModel = Spine.Model.setup("ApiModel", ["id", "fields"]);
  ApiModel.include({
    init: function(atts) {
      if (atts) this.load(atts);

      if (!this.fields) {
        var propertiesListObject = this.properties;
        this.fields = ApiModelProperty.sub();

        for (var propName in propertiesListObject) {
          if (propName != "parent") {
            var p = propertiesListObject[propName];
            p.name = propName;
            p.id = Spine.guid();
            // log(p);
            this.fields.create(p);
          }
        }
        //log("got " + this.fields.count() + " fields for " + this.id);
      }
    },

    toString: function() {
      var propsString = "";

      propsString += "(";
      for (var i = 0; i < this.fields.all().length; i++) {
        var e = this.fields.all()[i];

        if (propsString.length > 1)
        propsString += ", ";

        propsString += e.toString();
      }
      propsString += ")";

      if (this.required)
      return this.id + " (required): " + propsString;
      else
      return this.id + ": " + propsString;
    }

  });


  // Model: ApiModelProperty
  var ApiModelProperty = Spine.Model.setup("ApiModelProperty", ["name", "required", "dataType"]);
  ApiModelProperty.include({
    init: function(atts) {
      if (atts) this.load(atts);

      if (!this.dataType) {
        if (atts.type == "any")
        this.dataType = "object";
        else if (atts.type == "array") {
          if (atts.items) {
            if (atts.items.$ref) {
              this.dataType = "array[" + atts.items.$ref + "]";
            } else {
              this.dataType = "array[" + atts.items.type + "]";
            }
          } else {
            this.dataType = "array";
          }
        } else
        this.dataType = atts.type;

      }
    },

    toString: function() {
      if (this.required)
      return this.name + ": " + this.dataType + " (required)";
      else
      return this.name + ": " + this.dataType;
    }

  });

  
  // Controller
  var ModelController = Spine.Controller.create({
    countLoaded: 0,
    proxied: ["fetchResources", "loadResources", "apisLoaded", "modelsLoaded"],

    init: function() {
      // log("ModelController.init");

      this.fetchEndpoints();
    },

    fetchEndpoints: function() {
      var controller = this;

      updateStatus("Fetching API List...");
      $.getJSON(apiHost + "/" + "resources.json" + apiKeySuffix,
      function(response) {
        //log(response);
        ApiResource.createAll(response.apis);

        // get rid of the root resource list api since we're not going to document that
        var obj = ApiResource.findByAttribute("name", "resources");
        if (obj)
        obj.destroy();


        controller.fetchResources();
      });
    },

    fetchResources: function() {
      //log("fetchResources");
      //ApiResource.logAll();
      for (var i = 0; i < ApiResource.all().length; i++) {
        var apiResource = ApiResource.all()[i];
        this.fetchResource(apiResource);
      }
    },

    fetchResource: function(apiResource) {
      var controller = this;
      updateStatus("Fetching " + apiResource.name + "...");
      $.getJSON(apiHost + "/" + apiResource.name + "/list_api"+  apiKeySuffix,
      function(response) {
        controller.loadResources(response, apiResource);
      });
    },

    loadResources: function(response, apiResource) {
      try {
        this.countLoaded++;
        //    log(response);
        apiResource.addApis(response.apis);
        //        updateStatus("Parsed Apis");
        //log(response.models);
        if (response.models) {
          // log("response.models.length = " + response.models.length);
          for (var modeName in response.models) {
            var m = response.models[modeName];
            // log("creating " + m.id);
            apiResource.addModel(m);
            //      apiResource.modelList.create(m);
          }
        }

        updateStatus();
      } finally {
        if (this.countLoaded == ApiResource.count()) {
          log("all models/api loaded");
          ApiResource.trigger("refresh");
        }
      }
    }

  });

  

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

  SwaggerService.TestCase = function(){
  	ApiTestCaseController.init();
  	return ApiTestCase;
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
  		$.getJSON("http://localhost/mobion/real/list_test_case/d5823180aafe11e19912005056a70023", 
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


  
  this.init = function() {
    this.modelController = ModelController.init();
  };
};

