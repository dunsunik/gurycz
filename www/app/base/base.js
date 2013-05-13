angular.module('gury.base', [])

// centerVertically

.directive( 'centerVertically', [ '$location', '$timeout', function( $location, $timeout ) {
  return {
    link: function( scope, elm, attrs ) {
	var offset = angular.isDefined(attrs.offsetTop) ? parseInt(attrs.offsetTop) + 0 : 0;

	var handler = function() {
		$(elm).css({
			top: ((($(window).height() - $(elm).outerHeight()) / 2) + offset),
			left: (($(window).width() - $(elm).outerWidth()) / 2)
		});
	};

	$(window).resize(function(){
		handler();
	});

	// force alement to be positioned absolute so that width and height are real element dimensions
	$(elm).css('float', 'left');
	$(elm).css('position', 'absolute');

	// when ctrl+r page text was not aligned to a center this hacked it
	$timeout(function() {	
		$(elm).css('visibility', 'visible');
		handler();
	}, 500);
    }
  };
}])


// activeIfCurrent
.directive( 'activeIfCurrent', [ '$location', function( $location ) {
  return {
    scope: true,
    link: function( scope, element, attrs ) {
	var check = function check () {
	  var el = element.find( 'a' );
	  var path = $location.path();
	  var href = el.attr( 'href' );
	  if ( path === href || '#' + path === href ) {
	    element.addClass( 'active' );
	  } else {
	    element.removeClass( 'active' );
	  }
	};

	scope.$on( '$routeChangeSuccess', check );
	scope.$on( '$locationChangeSuccess', check );
    }
  };
}])

// service
.factory('titleService', ['$document', function($document) {
  var suffix, title;
  
  var titleService = {
    setSuffix: function setSuffix ( s ) {
	suffix = s;
    },
    getSuffix: function getSuffix () {
	return suffix;
    },
    setTitle: function setTitle ( t ) {
	if ( angular.isDefined( suffix ) ) {
	  title = t + suffix;
	} else {
	  title = t;
	}

	$document.prop( 'title', title );
    },
    getTitle: function getTitle () {
	return $document.prop( 'title' );
    }
  };

  return titleService;
}]).

// Validation
factory('Validation', ['$rootScope', function($rootScope) {
	var self = this;

	/**
	* structure of self.data:
	* definitions
	*	|--club_contact			(this is a group name)
	*	|	|--columns
	*	|		|--email		(this is a key name)
	*	|		|	|--disabled
	*	|		|	|--errmsg
	*	|		|	|--errs
	*	|		|	|--rules
	*	|		|		|--max_length
	*	|		|		|--regexp_match
	*	|		|--idcontact
	*	|			|--visible
	*	|				
	*	|--address
	*	|	|--columns
	*	|		|--firstname
	*	|
	*	|--simple
	*	|	|--columns
	*	|		|--login
	**/

	self.data = {};

	self.init = function(opts) {
		$rootScope.$Validation = $rootScope.$Validation || {};
		$rootScope.$Validation = self;
	};

	self.set = function(opts) {
		$rootScope.$Validation = $rootScope.$Validation || {};
		$rootScope.$Validation = self;
	};

	self.setInvalid = function(path) {
		return self.set(path, false, undefined);
	};

	self.setValid = function(path) {
		return self.set(path, true, undefined);
	};

	// 
	self.getBlankDefinitionStructure = function(path) {
		var group = self.getGroup(path);
		var key = self.getKey(path);
		var hash = {};
		hash[group] = {
			columns: {}
		};
		hash[group].columns[key] = {};
		return hash;
	};

	self.set = function(path, validity) {
		return self.set(obj, validity, undefined);
	};

	self.set = function(path, validity, errmsg) {
		if(path) {
			var col = self.getColumnByPath(path);

			if(!col) {
				var def = self.getDefinitionByPath(path);
				var group = self.getGroup(path);
				var key = self.getKey(path);
				if(!def) {
					self.data.definitions[group] = self.getBlankDefinitionStructure(path)[group];
				}
				col = self.getColumnByPath(path);
			}

			if(col) {
				col.err = !validity;
				if(errmsg) {
					col.errmsg = errmsg;
				}
			}
		}
	};

	// returns Hashtable object containing all validations
	self.getAll = function() {
		return self.data.validations;
	};

	// return array of all validations entries
	self.getAllEntries = function() {
		return self.data.validations.entries();
	};

	self.get = function(path) {
		var result = {};
		if(path !== undefined) {
			var col = self.getColumnByPath(path);
			if(col && col.err) {
				result.err = true;
				result.errmsg = col.errmsg;
			}
		}
		return result;
	};

	// just read the previously processed and set validity flag
	self.isValid = function(path) {
		var result = self.get(path);
		return result && result.err ? false : true;
	};

	self.isInvalid = function(path) {
		return !self.isValid(path);
	};

	self.getErrMsg = function(path) {
		var result = self.get(path);
		return (result && result.errmsg) ? result.errmsg : '';
	};

	self.processValidation = function(key, val) {
		var isValid = self.isValidProcess(key, val);
	};

	// bind a set of validation definitions to a specified group(s)
	self.bindDefiniotionsToGroup = function(key, val) {
		var isValid = self.isValidProcess(key, val);
	};

	// check if val is valid (key is a key within validation definitions)
	self.isValidProcess = function(path, val) {
		var def = self.getColumnByPath(path);

		if(!def) {
			return true;
		}

		var rules = def.rules;

		var isNum = function(val) {
			return isNaN(val) || val === '' ? false : true;
		};

		var isInt = function(val) {
			return isNum(val) && val % 1 === 0 ? true : false;
		};

		var isFloating = function(val) {
			return isNum(val) && !isInt(val) ? true : false;
		};

		var isArray = function(val) {
			return $.isArray(val) ? true : false;
		};

		var isString = function(val) {
			return jQuery.type(val) === 'string' ? true : false;
		};

		var isEmpty = function(val) {
			if(isNum(val)) {
				return val !== undefined && val != null ? false : true;
			}
			else {
				return val !== undefined && val != null && val.length > 0 ? false : true;
			}
		};

		var isAnyOf = function(val, array) {
			return !(val !== undefined && jQuery.inArray(val, array)) ? false : true;
		};

			
		// check type
		if(def.type && val != null) {
			// int
			if(def.type == "int") {
				if(!isInt(val)) {
					return false;
				}
			}
			// float, double
			else if(def.type == "float" || def.type == "double") {
				if(!isFloating(val)) {
					return false;
				}
			}
			// date
			else if(def.type == "date") {
			
			}
			// array
			else if(def.type == "array") {
				if(!isArray(val)) {
					return false;
				}
			}
			// hash
			else if(def.type == "hash") {
				if(!isArray(val) && !(val instanceof Object)) {
					return false;
				}
			}
			// str
			else if(def.type == "str") {
				if(!isString(val)) {
					return false;
				}
			}
		}

		// check rules
		if(rules) {
			// not_null
			if(rules.not_null) {
				if(val == null || val === undefined) {
					return false;
				}
			}

			// not_empty
			if(rules.not_empty) {
				if(isEmpty(val)) {
					return false;
				}
			}

			// required
			if(rules.required) {
				if(isEmpty(val)) {
					return false;
				}
			}

			// email
			if(rules.email) {
				//  RFC 2822 implementation
				var regexp = new Regexp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
				if(!(val !== undefined && val.match(regexp))) {
					return false;
				}
			}

			// any_of
			if(rules.any_of) {
				if(!isAnyOf(val, rules.any_of)) {
					return false;
				}
			}

			// none_of
			if(rules.none_of) {
				if(isAnyOf(val, rules.none_of)) {
					return false;
				}
			}

			// max_val
			if(rules.max_val) {
				if(!(val !== undefined && val <= rules.max_val)) {
					return false;
				}
			}

			// min_val
			if(rules.min_val) {
				if(!(val !== undefined && val >= rules.min_val)) {
					return false;
				}
			}

			// max_length
			if(rules.max_length) {
				if(!(val !== undefined && val.length <= rules.max_length)) {
					return false;
				}
			}

			// min_length
			if(rules.min_length) {
				if(!(val !== undefined && val.length >= rules.min_length)) {
					return false;
				}
			}

			// regexp_match
			if(rules.regexp_match) {
				if(!(val !== undefined && val.match(new RegExp(rules.regexp_match)))) {
					return false;
				}
			}	 
		}

		return true;
	};


	// parse group from a path
	self.getGroup = function(path) {
			return path ? path.replace(/([^.]*)\.(.*)/, "$1") : "";
	};

	// parse key from a path
	self.getKey = function(path) {
			var key = path.replace(/([^.]*)\.(.*)/, "$2");
			return key;
	};

	self.setDefinitions = function(obj) {
		self.data.definitions = obj;
	};

	self.getDefinitions = function() {
		return self.data.definitions;
	};


	self.getDefinitionByPath = function(path) {
		var group = self.getGroup(path);
		return self.getDefinitions()[group];
	};

	self.getDefinitionByGroup = function(group) {
		return self.getDefinitions()[group];
	};

	// get columns associated with a specified path
	self.getColumns = function(path) {
		var group = self.getGroup(path);

		var def = self.getDefinitionByGroup(group);

		
		if(def) {
			return def.columns;
		}

		return {};
	};

	self.getColumnByPath = function(path) {
		var cols = self.getColumns(path);
		var key = self.getKey(path);
		return (key in cols) ? cols[key] : {};
	};

	self.getColumnByKey = function(key) {
		var cols = self.getColumns(path);
		return (key in cols) ? cols[key] : {};
	};

	return self;
}]).

// Working
factory('Working', ['$rootScope', function($rootScope) {
	var self = this;

	self.data = {};

	self.init = function() {
		$rootScope.$Working = $rootScope.$Working || {};
		$rootScope.$Working = self;
	};

	self.setOrUnset = function(name, isWorking) {
		return self.data[name] = isWorking;
	};

	self.set = function(name) {
		return self.setOrUnset(name, true);
	};

	self.unset = function(name) {
		return self.setOrUnset(name, false);
	};

	self.get = function(name) {
		var obj = self.data[name];
		return obj ? true : false;
	};

	self.isWorking = function(name) {
		return self.get(name);
	};

	return self;
}]).

// Cache
factory('cache', ['$cacheFactory', function($cacheFactory) {
	var cache = $cacheFactory('myCache');
	return cache;
}]);
