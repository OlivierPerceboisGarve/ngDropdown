(function() {
angular.module('testdirective', ['ngResource', 'ngSanitize', 'ui.keypress', 'ngMockE2E'])//
.run(function($httpBackend) {
  $httpBackend.whenGET('api/vegies').respond(
    [{id: 1, name: 'lettuce'}, {id: 2, name: 'carots'}, {id: 3, name: 'pumpkin'}]
  );
})
.factory('vegiesFactory', function($resource){//
 return  $resource('api/vegies');//[{id: 1, name: 'lettuce'}, {id: 2, name: 'carots'}, {id: 3, name: 'pumpkin'}];//
}) 
.controller('vegies', function($scope, vegiesFactory){
	//console.log(vegiesFactory);
	$scope.vegies = vegiesFactory.query();
	//console.log($scope.vegies);
})
.directive("dropdown", ['$sce' ,
				function($sce) { //
	var DDO = {
		restrict: 'E',
		require: 'ngModel',
		template: '<div ng-click="dropdown.show = !dropdown.show;" tabindex="0" ng-class="{open: dropdown.show, closed: !dropdown.show}" ui-keypress="{\'shift-tab\': \'tab();\', \'tab\': \'tab();\', \'up\': \'up();\', \'down\': \'down($event);\'}"><input type="hidden" ng-bind="dropdown.value" /><span ng-bind-html="dropdown.selection" class="selection"></span><ul ng-show="dropdown.show" class="wrap" ng-transclude></ul></div>',
		transclude: true,
		scope: true,
		controller: ['$scope', '$element', '$timeout',
			function( $scope,   $element,   $timeout) {
			$scope.dropdown = {
				selection : 'removeme',
				value : false,
				show : false
			};

			this.defaultIsSet = false;
			var options = this.options = [];
			this.addOption = function (option) {
				return options.push(option);
			};

			this.select = function select(el) {
				//$scope.dropdown.selection = $sce.trustAsHtml(el.html());
				//$scope.dropdown.value = el.attr('value');
			};

			this.selectRank = function selectRank(rank) {
				console.log('selectRank ', rank, !this.defaultIsSet, options[rank-1].text());
				
				if (this.defaultIsSet === false){
					this.defaultIsSet = true;
					console.info('options[rank-1].text() : ', options[rank-1].text());
					console.log('options[rank-1] : ', options[rank-1]);
					$scope.dropdown.selection = $sce.trustAsHtml(options[rank-1].html());//'fake';//
					$scope.dropdown.value = options[rank-1].attr('value');					
				}

			};

			$scope.tab = $scope.up = function(){
			  console.log('tab');
				$scope.dropdown.show = false;
			};

			$scope.down = function($event){
        		console.log('down');
				$event.preventDefault();
				$event.stopPropagation();
				$scope.dropdown.show = true;
				$timeout(function(){
					$element.find('ul.wrap li.option').first()[0].focus();
				},
				0);
			};
		}],
		post: function($scope, el, attr, ngModel) {
			$scope.$watch('dropdown.value',function (newVal) {
				ngModel.$setViewValue(newVal);
			});
		}
	};
	return DDO;
}])
.directive('ddli',[ '$interpolate', function($interpolate) {
	var DDO = {
		restrict: 'E',
		require: '^dropdown',
		template: '<li class="option" tabindex="0" ng-click="selectEl()" ui-keypress="{\'up\': \'up($event);\', \'down\': \'down($event);\'}" ></li>',//
		transclude: true,
		replace: true,
		priority: 100,
		scope: true,
		compile: function(el, attrs){
			return function(scope, el, attrs, controller,  $transclude) {
				  $transclude(scope, function(nodes) {
				    //el.html(''); 
				  // console.log('transclude o', el[0]);
				    
				    el.append(nodes);
				  }); 
				console.log('attrs', attrs);
				var interpolateTextFn = $interpolate(el.text(), true);
				var interpolateDefaultFn = $interpolate(attrs, true);
				var state = {text: el.text(), default: attrs.default}; 
				var dropdown = controller;
				var rank = dropdown.addOption(el);
			    if (interpolateTextFn){
			      	console.info('WATCH');
			        scope.$watch(update, render,true);
			    } else {
			      	console.log('no interpolateFn');
			      	render(state);
			    }
			      
			    function update() {
			        console.log('update');
			        if (interpolateTextFn) {
			        	console.log('interpolateFn in update');
			        	state.text = interpolateTextFn(scope);
			        	//state.default = interpolateDefaultFn(scope);
			    	}
			    	return state;
			    }
			    function render(value) {
			    	console.log('render', value.text);
			    	el.text(value.text);
			    	console.warn('value.default', value.default);
			    	dropdown.selectRank(rank)
			    }
	      
				scope.selectEl = function() {
					dropdown.select(el);
				};
	    		//console.log('select');
				if (dropdown.defaultIsSet === false){
				  //ISSUE WAS HERE
					//scope.selectEl();
					//dropdown.selectRank(rank);
					console.log('select');
				} else	if (attrs.default !== undefined) {
				  console.log('selectEl');
					//scope.selectEl();
				}

				scope.up = function($event){
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdown.options[rank-2])){
						dropdown.options[rank-2].focus();
					} else {
						var len = dropdown.options.length;
						dropdown.options[len-1].focus();
					}
				};

				scope.down = function($event){
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdown.options[rank])){
						dropdown.options[rank].focus();
					} else {
						dropdown.options[0].focus();
					}
				};
			}

		}

	};
	return DDO;
}]);

}());