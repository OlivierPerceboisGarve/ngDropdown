(function() {
console.log('angular : ', angular);
angular.module('testdirective', ['ngResource', 'ngSanitize', 'ui.keypress', 'ngMockE2E'])
.run(function($httpBackend) {
  $httpBackend.whenGET('api/vegies').respond(
    [{id: 1, name: 'lettuce'}, {id: 2, name: 'carots'}, {id: 3, name: 'pumpkin'}]
  );
  $httpBackend.whenGET('api/fishes').respond(
    [{id: 1, name: 'brochet'}, {id: 2, name: 'matjes'}, {id: 3, name: 'sandre'}, {id: 4, name: 'turbot'}]
  );
})
.factory('vegiesFactory', function($resource){
 return  $resource('api/vegies');
})
.factory('fishesFactory', function($resource){
 return  $resource('api/fishes');
}) 
.controller('food', function($scope, vegiesFactory, fishesFactory){
	$scope.vegies = vegiesFactory.query();
	$scope.fishes = fishesFactory.query();
})
.directive("dropdown", ['$sce' , '$compile',
				function($sce, $compile) {
	var DDO = {
		restrict: 'E',
		require: '?ngModel',
		template: function(that, el){//TODO rename vars
			return '<div ng-click="dropdown.show = !dropdown.show;" tabindex="0" ng-class="{open: dropdown.show, closed: !dropdown.show}" ui-keypress="{\'shift-tab\': \'tab();\', \'tab\': \'tab();\', \'up\': \'up();\', \'down\': \'down($event);\'}"><input type="hidden" name="'+el.name+'" ng-model="dropdown.value" /><span ng-bind-html="dropdown.selection" class="selection"></span><ul ng-show="dropdown.show" class="wrap" ng-transclude></ul></div>';
		},
		transclude: true,
		scope: true,
		//priority: 100,
		controller: ['$scope', '$element', '$timeout',
			function( $scope,   $element,   $timeout) {

			//var tpl = '<div ng-click="dropdown.show = !dropdown.show;" tabindex="0" ng-class="{open: dropdown.show, closed: !dropdown.show}" ui-keypress="{\'shift-tab\': \'tab();\', \'tab\': \'tab();\', \'up\': \'up();\', \'down\': \'down($event);\'}"><input type="hidden" ng-model="dropdown.value" /><span ng-bind-html="dropdown.selection" class="selection"></span><ul ng-show="dropdown.show" class="wrap" ng-transclude></ul></div>',
		

			$scope.dropdown = {
				selection : 'removeme',
				value : false,
				show : false,
				firstOptionSelected : false
				
			};

			this.options = [];
			this.hasFocus = false;
			//var indexDefault = $scope.indexDefault = 0;
			//$scope.inputname = $element.attr('name');
			//console.log('$element', $element.attr('name'));
			//this.foo = 'foooo';
			//console.log('dsfdfg');

			//console.log($compile(tpl)($scope));
			//$element.append($compile(tpl)($scope));
			var doc = angular.element(document);
			console.log('doc : ', doc);
			window.onclick = function foo(){
				console.log(this);
			};


			//$element[0].onmousemove = function(e){
				//console.log('DD hover', e, this);


			//}
			

			this.addOption = function (option) {
				return this.options.push(option[0]);
			};


			this.preselect = function select(el, isDefault) {
				if (!$scope.firstOptionSelected || isDefault){
					$scope.firstOptionSelected = true;
					this.select(el);
				}
			};

			this.select = function select(el) {
				$scope.dropdown.selection = $sce.trustAsHtml(el.html());
				$scope.dropdown.value = el.attr('value');
			};

			$scope.tab = $scope.up = function(){
				console.log();
				$scope.dropdown.show = false;
			};

			$scope.down = function($event){
				$event.preventDefault();
				$event.stopPropagation();
				$scope.dropdown.show = true;
				$timeout(function(){
					//equivalent to jQuery('li.option')[0].focus(); //yep, verbose.
					var lis = $element.find('li');
					var focused = false;
					for (var i = 0, len = lis.length; i < len; i++){
						if (angular.element(lis[0]).hasClass('option')){
							lis[0].focus();
							focused = true;
						}	
					}
				},
				0);
			};
		}],

		compile: function compile(el, attr){
			/*$transclude(scope, function(nodes) {
				el.append(nodes);
			});*/ 
			return {
				link: function($scope, el, attr, ngModel) {
					$scope.$watch('dropdown.value',function (newVal) {	
						ngModel.$setViewValue(newVal);
					});
				}				
			}

		}

	};
	return DDO;
}])
.directive('ddli',[ '$interpolate', function($interpolate) {
	var DDO = {
		restrict: 'E',
		require: '^dropdown',
		template: '<li class="option" tabindex="0" ng-click="selectEl()" ui-keypress="{\'shift-tab\': \'tab();\', \'tab\': \'tab();\', \'up\': \'up($event);\', \'down\': \'down($event);\'}" ></li>',//
		transclude: true,
		replace: true,
		scope: true,
		compile: function(el, attrs){
			return function(scope, el, attrs, controller,  $transclude) {
				$transclude(scope, function(nodes) {
					el.append(nodes);
				}); 

				var dropdownCtrl = controller;

				var interpolateTextFn = $interpolate(el.text(), true);
				var interpolateDefaultFn = $interpolate(attrs, true);
				var state = {text: el.text(), default: attrs.default}; 
				
				var rank = dropdownCtrl.addOption(el);//let the dropdown controller know about this option element and receive an iterator back
				console.log('ddli');

				el[0].onfocus = function(){
					//console.log('focus', arguments);
				}
		    	

				el[0].onmousemove= function(e){
					if (this ===document.activeElement){
						console.log('same');
					}else{
						console.log('other');
						this.focus();
					}
				}

			

			    if (interpolateTextFn){
			        scope.$watch(update, render,true);
			    } else {
			      	render(state);
			    }
			      
			    function update() {
			        if (interpolateTextFn) {
			        	state.text = interpolateTextFn(scope);
			    	}
			    	return state;
			    }
			    function render(value) {
			    	el.text(value.text);


			    	dropdownCtrl.preselect(el);
			    	if (angular.isDefined(value.default) && value.default !== 'false'){
			    		dropdownCtrl.preselect(el, true);
			    	}			    	
			    }
	      
				scope.selectEl = function() {
					dropdownCtrl.select(el);
				};


				scope.up = function($event){
					console.log('up');
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[rank-2])){
						dropdownCtrl.options[rank-2].focus();
					} else {
						var len = dropdownCtrl.options.length;
						dropdownCtrl.options[len-1].focus();
					}
				};

				scope.down = function($event){
					console.log('down');
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[rank])){
						dropdownCtrl.options[rank].focus();
					} else {
						dropdownCtrl.options[0].focus();
					}
				};
			}

		}

	};
	return DDO;
}]);

}());