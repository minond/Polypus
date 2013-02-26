(function(Polypus) {
	"use strict";

	var Service, service_cache, make_service_call, as_service_call,
		parse_service_arguments, get_method_arguments, is_service_arg,
		clean_up_service_name, get_service_by_name, di;

	/**
	 * @var object
	 */
	service_cache = {};

	/**
	 * as_service_call helper
	 * @param function func
	 * @return ServiceRequest
	 */
	di = function(func) {
		return Service.api.as_service_call.call(Service.api, func);
	};

	/**
	 * search the service_cache by name
	 * @param string serv
	 * @return ServiceInstance
	 */
	get_service_by_name = function(serv) {
		var base = this.clean_up_service_name(serv);
		return base in service_cache ? service_cache[ base ] : null;
	};

	/**
	 * remover argument service name dollar sign
	 * @param string serv
	 * @return string
	 */
	clean_up_service_name = function(serv) {
		return serv.replace(/^\$/, "");
	};

	/**
	 * return true if argument is for a service
	 * @param string arg
	 * @return boolean
	 */
	is_service_arg = function(arg) {
		return /^\$/.test(arg);
	};

	/**
	 * return dependency injection for a given function. { start: int,
	 * services: ServiceInstance[] }
	 * @param function func
	 * @return object
	 */
	parse_service_arguments = function(func) {
		var servstart = 0, servs = [], that = this,
			args = Polypus.adjutor.parse_function_arguments(func);

		Polypus.adjutor.foreach(args, function(i, arg) {
			if (is_service_arg(arg)) {
				if (!servstart) {
					servstart = i;
				}

				servs.push(that.get_service_by_name(arg));
				return;
			}

			if (servstart) {
				servs.push(undefined);
			}
		});

		return {
			start: servstart,
			services: servs
		};
	};

	/**
	 * return an array of arguments to be used on a service call
	 * @param function func
	 * @param array userargs
	 * @return array
	 */
	get_method_arguments = function(func, userargs) {
		var i, j, len, services = this.parse_service_arguments(func),
			userargs = Array.prototype.splice.call(userargs, 0), args = [];

		for (i = 0, len = func.length; i < len; i++) {
			// service argument?
			if (i >= services.start) {
				j = i - services.start;
				if (userargs[ i ]) {
					args[ i ] = userargs[ i ];
				} else {
					args[ i ] = services.services[ j ];
				}
			} else {
				args[ i ] = userargs[ i ];
			}
		}

		return args;
	};

	/**
	 * wrap a function around a dependency injection function
	 * @param function func
	 * @retrurn function
	 */
	as_service_call = function(func) {
		var that = this;
		return function ServiceRequest(args) {
			var args = that.get_method_arguments(func, arguments);
			return func.apply(this, args);
		};
	};

	/**
	 * @param string name
	 * @param object config
	 * @param object props
	 */
	Service = Polypus.Service = function ServiceInstance(name, config, props) {
		var Base, Instance;

		if (!config) {
			config = {};
		}

		if (!props) {
			props = config;
			config = {};
		}

		Base = function ServiceBase() {};
		Polypus.adjutor.foreach(props, function(key, val) {
			if (val instanceof Function) {
				Base.prototype[ key ] = di(val);
			} else {
				Base.prototype[ key ] = val;
			}
		});

		Instance = new Base;
		Instance.config = { di: {} };
		service_cache[ name ] = Instance;
		return Instance;
	};

	/**
	 * configuration items
	 * @var object
	 */
	Service.config = {
	};

	/**
	 * for testing
	 * @var object
	 */
	Service.api = {
		di: di,
		make_service_call: make_service_call,
		as_service_call: as_service_call,
		parse_service_arguments: parse_service_arguments,
		get_method_arguments: get_method_arguments,
		is_service_arg: is_service_arg,
		clean_up_service_name: clean_up_service_name,
		get_service_by_name: get_service_by_name
	};
})(Polypus);
