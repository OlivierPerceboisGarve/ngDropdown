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
		priority: 100,
		replace: true,
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
			this.$element = $element.find('div');
			this.show = $scope.dropdown.show;
			//var indexDefault = $scope.indexDefault = 0;
			//$scope.inputname = $element.attr('name');
			//console.log('$element', $element.attr('name'));
			//this.foo = 'foooo';
			//console.log('dsfdfg');

			//console.log($compile(tpl)($scope));
			//$element.append($compile(tpl)($scope));
			var ctrl = this;
			/*
			window.setInterval(function(){
				console.log('interval', ctrl);
				ctrl.hasFocus();
			}, 1000);
*/
			var doc = angular.element(document);
			doc[0].onclick = function(){
				console.log('doc click');
				$scope.dropdown.show = false;
			}
			//console.log('doc : ', doc);
			window.onclick = function foo(e){
				console.log(e, this);
			};


			//$element[0].onmousemove = function(e){
				//console.log('DD hover', e, this);


			//}
			$element[0].onblur = function(){
				console.log('DD blur', document.activeElenent, arguments);
			}

			this.hasFocus = function(){
				var hasFocus = false;
				console.log('document.activeElement : ', document.activeElement);
				this.options.forEach(function(el){
					console.log('options elems :', el);
					if (el === document.activeElement){
						console.info('WINNER');
						hasFocus = true;
					}
				});
				if (!hasFocus){
					console.log('has foc', $element[0]);
					//if ($element) 
				}


			}
			//this.reset
			

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
				console.log('newval shoud be', $scope.dropdown.value);
				$timeout(function(){
					console.log('select', $element.find('div')[0]);
					$scope.dropdown.show = false;
					$element.find('div')[0].focus();
				}, 0);
			};

			$scope.tab = $scope.up = function(){
				console.log('DD tab');
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
			return function($scope, el, attr, ngModel) {
				$scope.$watch('dropdown.value',function (newVal, oldVal) {	
					ngModel.$setViewValue(newVal);
				});
								
			}

		}

	};
	return DDO;
}])
.directive('ddli',[ '$interpolate', '$timeout', function($interpolate,  $timeout) {
	var DDO = {
		restrict: 'E',
		require: '^dropdown',
		template: '<li class="option" tabindex="0" ng-click="selectEl()" ui-keypress="{\'shift-tab\': \'tab1();\', \'enter\': \'selectEl();\',\'tab\': \'tab1();\', \'up\': \'up($event);\', \'down\': \'down($event);\'}" ></li>',//
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
				//onsole.log('ddli', dropdownCtrl);

				el[0].onblur = function(){
					console.log('ddli blur', document.activeElement, arguments);
				}
		    	

				el[0].onmousemove= function(e){
					if (this === document.activeElement){
						console.log('same');
					}else{
						console.log('other');
						this.focus();
						//$timeout(function(){
						//	console.log('ddli onmousemove refocus', document.activeElenent);
						//},100);
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
					//dropdownCtrl.$element[0].focus();

				};

				scope.tab1 = function(){
					console.log('dropdownCtrl', dropdownCtrl);
					//dropdown.show
				}


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
					dropdownCtrl.hasFocus();
					//$timeout(function(){
						//dropdownCtrl.hasFocus();
					//console.log('ddli up refocus has Focus', dropdownCtrl.options[rank], '- 2 : ', dropdownCtrl.options[rank-1].hasFocus , '- 3 : ', dropdownCtrl.options[rank-2].hasFocus  );
					//console.log('doc active el', document.activeElement);
					//}, 100);
				};

				scope.down = function($event){
					console.log('down');
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[rank])){
						dropdownCtrl.options[rank].focus();
						console.log('ddli down refocus', document.activeElement);
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