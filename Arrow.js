;function Arrow(config) {

	// default arrow configuration params
	var	self = this,
		_config = {
			head: {
				width: 100,
				neck: 0,
				length: 100,
				angle: 0
			},
			path: [{
				x: 0,
				y: 0,
				width: 0,
				curve: {
					weight: 0,
					position: 0,
					samedir: true
				}
			}],
			tail: {
				length: -50
			},
			fillStyle: '#efefef',
			strokeStyle: 'black',
			lineWidth: 1
		},

	// preprocessed variables
	_preprocessed = {},

	// store arrow's points
	_points = [],

	// where arrow should be rendered
	_dom = null,  // canvas dom element
	_context = null,  // canvas context

	// true to set debug mode
	_debug = false,

	/**
	 * calculate arrows position path
	 */
	_calcPositions = function() {
		if(_config.path.length < 2) return;

		var points = [],
			points2 = [],
			temp = {},
			half_head = _preprocessed.head.half_width,

			// return angle(radians) from two 2d positions
			vec_angle = function(vec1, vec2) {
				var radians = Math.atan2(vec1.y - vec2.y, vec2.x - vec1.x);

				return {
					radians: radians,
					cos: Math.cos(radians),
					sin: Math.sin(radians)
				};
			},

			// return curve position
			calc_curve = function(point1, point2, curve) {
				if(! curve || ! curve.weight) return;

				var distance = self.vecDist(point1, point2) * (curve.position / 100),
					angle = vec_angle(point1, point2),
					position = {
						x: point1.x + (distance * angle.cos),
						y: point1.y - (distance * angle.sin)
					},
					radians = angle.radians + 1.5707963267948966,  // + 90 degrees
					new_curve = {
						radians: radians,
						cos: Math.cos(radians),
						sin: Math.sin(radians)
					},
					position = {
						x: position.x + (curve.weight * new_curve.cos),
						y: position.y - (curve.weight * new_curve.sin)
					};

				return position;
			};


		temp = vec_angle(_config.path[0], _config.path[1]);
		temp['half_path'] = (_config.path[0].width / 2) || 0;
		temp['half_path_sin'] = temp.sin * temp.half_path;
		temp['half_path_cos'] = temp.cos * temp.half_path;

		// arrow's tail
		points.push({
			x: _config.path[0].x - (temp.cos * _config.tail.length),
			y: _config.path[0].y + (temp.sin * _config.tail.length)
		});

		points.push({
			x: _config.path[0].x - temp.half_path_sin,
			y: _config.path[0].y - temp.half_path_cos
		});
		points2.push({
			x: _config.path[0].x + temp.half_path_sin,
			y: _config.path[0].y + temp.half_path_cos
		});

		// arrow's body
		if(_config.path.length >= 3) {
			for(var i = 1, k = _config.path.length - 1; i < k; i++) {
				temp = vec_angle(_config.path[i - 1], _config.path[i]);
				temp['half_path'] = (_config.path[i].width / 2) || 0;
				temp['half_path_sin'] = temp.sin * temp.half_path;
				temp['half_path_cos'] = temp.cos * temp.half_path;

				temp['_points'] = [{
					x: _config.path[i].x - temp.half_path_sin - temp.half_path_cos,
					y: _config.path[i].y - temp.half_path_cos + temp.half_path_sin
				}, {
					x: _config.path[i].x + temp.half_path_sin - temp.half_path_cos,
					y: _config.path[i].y + temp.half_path_cos + temp.half_path_sin
				}];

				jQuery.extend(temp, vec_angle(_config.path[i], _config.path[i + 1]));
				temp['half_path_sin'] = temp.sin * temp.half_path;
				temp['half_path_cos'] = temp.cos * temp.half_path;

				jQuery.merge(temp._points, [{
					x: _config.path[i].x - temp.half_path_sin + temp.half_path_cos,
					y: _config.path[i].y - temp.half_path_cos - temp.half_path_sin
				}, {
					x: _config.path[i].x + temp.half_path_sin + temp.half_path_cos,
					y: _config.path[i].y + temp.half_path_cos - temp.half_path_sin
				}]);


				// calculate curve
				temp['curve'] = jQuery.extend({
					samedir: true
				}, _config.path[i].curve);
				temp['curve_point_a'] = points[points.length - 1];
				temp['curve_point_b'] = temp._points[0];
				jQuery.extend(temp.curve_point_b, {
					curve: calc_curve(temp.curve_point_a, temp.curve_point_b, temp.curve)
				});

				temp['curve_point_a'] = points2[points2.length - 1];
				temp['curve_point_b'] = temp._points[1];
				jQuery.extend(temp.curve_point_a, {
					curve: calc_curve(temp.curve_point_a, temp.curve_point_b, jQuery.extend({}, temp.curve, {
						weight: (temp.curve.samedir ? 1 : -1) * temp.curve.weight
					}))
				});
				// end calculate curve

				points.push(temp._points[0], temp._points[2]);
				points2.push(temp._points[1], temp._points[3]);
			}
		}

		// arrow's head
		temp['coords'] = _config.path.slice(-2);
		jQuery.extend(temp, vec_angle(temp['coords'][0], temp['coords'][1]));
		temp['half_path'] = (temp['coords'][1].width / 2) || 0;
		temp['half_path_sin'] = temp.sin * temp.half_path;
		temp['half_path_cos'] = temp.cos * temp.half_path;
		temp['head_length_sin'] = temp.sin * _config.head.length;
		temp['head_length_cos'] = temp.cos * _config.head.length;
		temp['half_head_sin'] = temp.sin * half_head;
		temp['half_head_cos'] = temp.cos * half_head;
		temp['head_and_neck'] = _config.head.length + _config.head.neck;
		temp['head_and_neck_sin'] = temp.sin * temp.head_and_neck;
		temp['head_and_neck_cos'] = temp.cos * temp.head_and_neck;

		temp['head_temp1'] = temp.half_path_cos + temp.head_and_neck_sin;
		temp['head_temp2'] = temp.half_path_sin + temp.head_and_neck_cos;
		temp['head_temp3'] = temp.half_path_cos - temp.head_and_neck_sin;
		temp['head_temp4'] = temp.half_path_sin - temp.head_and_neck_cos;
		temp['head_temp5'] = temp.head_length_cos + temp.half_head_sin;
		temp['head_temp6'] = temp.head_length_sin - temp.half_head_cos;
		temp['head_temp7'] = temp.head_length_cos - temp.half_head_sin;
		temp['head_temp8'] = temp.head_length_sin + temp.half_head_cos;

		// head's angle
		temp['head_angle_radians'] = _preprocessed.head.angle.radians;
		temp['head_angle_radians_cos'] = _preprocessed.head.angle.cos;
		temp['head_angle_radians_sin'] = _preprocessed.head.angle.sin;

		points.push({
			x: temp.coords[1].x - (temp.head_angle_radians_cos * temp.head_temp2) + (temp.head_angle_radians_sin * temp.head_temp3),
			y: temp.coords[1].y - (temp.head_angle_radians_cos * temp.head_temp3) - (temp.head_angle_radians_sin * temp.head_temp2)
		});
		points2.push({
			x: temp.coords[1].x + (temp.head_angle_radians_cos * temp.head_temp4) - (temp.head_angle_radians_sin * temp.head_temp1),
			y: temp.coords[1].y + (temp.head_angle_radians_cos * temp.head_temp1) + (temp.head_angle_radians_sin * temp.head_temp4)
		});

		// calculate curve
		temp['curve_point_a'] = points[points.length - 2];
		temp['curve_point_b'] = points[points.length - 1];
		temp['curve'] = jQuery.extend({
			samedir: true
		}, _config.path[_config.path.length - 1].curve);
		jQuery.extend(temp.curve_point_b, {
			curve: calc_curve(temp.curve_point_a, temp.curve_point_b, temp.curve)
		});
		// other side (inverse)
		temp['curve_point_a'] = points2[points2.length - 2];
		temp['curve_point_b'] = points2[points2.length - 1];
		jQuery.extend(temp.curve_point_a, {
			curve: calc_curve(temp.curve_point_a, temp.curve_point_b, jQuery.extend(temp.curve, {
				weight: (temp.curve.samedir ? 1 : - 1) * temp.curve.weight
			}))
		});
		// end calculate curve

		points.push({
			x: temp.coords[1].x - (temp.head_angle_radians_cos * temp.head_temp5) - (temp.head_angle_radians_sin * temp.head_temp6),
			y: temp.coords[1].y + (temp.head_angle_radians_cos * temp.head_temp6) - (temp.head_angle_radians_sin * temp.head_temp5)
		});
		points2.push({
			x: temp.coords[1].x - (temp.head_angle_radians_cos * temp.head_temp7) - (temp.head_angle_radians_sin * temp.head_temp8),
			y: temp.coords[1].y + (temp.head_angle_radians_cos * temp.head_temp8) - (temp.head_angle_radians_sin * temp.head_temp7)
		});

		points.push({
			x: temp.coords[1].x,
			y: temp.coords[1].y
		});

		_points = jQuery.merge(points, points2.reverse());

		return _points;
	};

	/**
	 * set arrow configuration params
	 */
	this.setConfig = function(config) {
		_config = jQuery.extend(true, _config, config || {});

		var head_angle_radians = this.degreesToRadians(_config.head.angle);

		jQuery.extend(true, _preprocessed, {
			head: {
				angle: {
					radians: head_angle_radians,
					cos: Math.cos(head_angle_radians),
					sin: Math.sin(head_angle_radians)
				},
				half_width: _config.head.width / 2
			}
		});

		_calcPositions();

		return this;
	},

	/*
	 * add array of XY coords to arrow's path
	 */
	this.addPath = function(path) {
		jQuery.each(jQuery.makeArray(path), function(i, _path){
			_config.path.push(path);
		});

		_calcPositions();

		return this;
	},

	/*
	 * set array of XY coords to arrow's path
	 */
	this.setPath = function(path) {
		_config.path = path;

		_calcPositions();

		return this;
	},

	this.getPath = function() {
		return _config.path;
	};

	/**
	 * set where arrow should be rendered
	 */
	this.renderTo = function(canvas_dom) {
		_dom = canvas_dom;
		_context = canvas_dom.get(0).getContext('2d');

		return this;
	},

	this.setDebug = function(debug) {
		_debug = debug;

		return this;
	},

	/**
	 * convert degrees to radians
	 */
	this.degreesToRadians = function(degrees) {
		return degrees * Math.PI / 180;
	},

	/**
	 * convert radians to degrees
	 */
	this.radiansToDegrees = function(radians) {
		return radians * 180 / Math.PI;
	},

	/**
	 * return arrow points array
	 */
	this.getPoints = function() {
		return _points;
	},

	// return the distance between two 2d positions
	this.vecDist = function(vec1, vec2) {
		var diff = {
				x: Math.abs(vec2.x - vec1.x),
				y: Math.abs(vec2.y - vec1.y)
			};

		return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
	},

	/**
	 * clear all canvas context for redrawing
	 */
	this.clearAll = function() {
		var dom_dimensions = {
			width: _dom.width(),
			height: _dom.height()
		};

		_context.setTransform(1, 0, 0, 1, 0, 0);
		_context.clearRect(0, 0, dom_dimensions.width, dom_dimensions.height);

		 return this;
	},

	/**
	 * redraw arrows position on the screen
	 */
	this.redraw = function() {
		var points = _points;

		_context.lineWidth = _config.lineWidth;
		_context.fillStyle = _config.fillStyle;
		_context.strokeStyle = _config.strokeStyle;

		_context.setTransform(1, 0, 0, 1, 0, 0);
		_context.beginPath();

		jQuery.each(points, function(i, point) {
			var curve = point.curve || point;

			_context.quadraticCurveTo(curve.x, curve.y, point.x, point.y);
		});

		_context.closePath();
		_context.stroke();
		_context.fill();

		if(_debug){
			this.debug();
		}

		return this;
	},

	/**
	 * toggle arrow's debug info
	 */
	this.debug = function () {
		var points = _points;

		// path nodes
		jQuery.each(_config.path, function(i, path) {
			_context.beginPath();
			_context.lineWidth = 1;
			_context.strokeStyle = 'blue';
			_context.fillStyle = 'blue';
			_context.arc(path.x, path.y, 3, 0, 2*Math.PI);
			_context.fill();
			_context.stroke();
			_context.closePath();
		});

		// point nodes
		jQuery.each(points, function(i, point) {
			_context.beginPath();
			_context.lineWidth = 1;
			_context.strokeStyle = 'red';
			_context.fillStyle = 'red';
			_context.arc(point.x, point.y, 1, 0, 2*Math.PI);
			_context.fill();
			_context.stroke();
			_context.closePath();
		});

		// curve nodes
		jQuery.each(points, function(i, point) {
			if(!point.curve) return;

			_context.beginPath();
			_context.lineWidth = 1;
			_context.strokeStyle = 'green';
			_context.fillStyle = 'green';
			_context.arc(point.curve.x, point.curve.y, 2, 0, 2*Math.PI);
			_context.fill();
			_context.stroke();
			_context.closePath();
		});

		return this;
	};

	this.setConfig(config);
};