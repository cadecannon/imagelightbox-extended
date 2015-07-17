define(['jquery'], function($){

	var ImageLightbox = function(selector, options){
		this.$selector = $(selector);
		//this.destory();

		this.isOpen = false;
		this.inProgress = false;
		this.currentImage = null;
		this.currentTarget = null;
		this.hasTransitionSupport = (this._cssTransitionSupport() !== false);
		this.hasTouch = ('ontouchstart' in window),
		this.hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
		this.listeners = {};
		this.$targets = $([]);


		this.imageWidth = 0;
		this.imageHeight = 0;
		this.swipeDiff = 0;

		/*
			$targets		= $([]),
			target		= $(),
			image		= $(),
			inProgress	= false,
			isTargetValid = function(element){
				var classic = $(element).prop('tagName').toLowerCase() === 'a' && (new RegExp('('+options.allowedTypes+')$', 'i')).test($(element).attr('href'));
				var html5 = $(element).attr('data-lightbox') !== undefined;
				return classic || html5;
			},
		*/

		this.options = $.extend(this.defaults, options);

		this._init();
	};

	$.extend(ImageLightbox.prototype,{
		defaults: {
			lightboxID: 'imagelightbox',
			allowedTypes: 'png|jpg|jpeg||gif', // add support for generated images without an extension
			animationSpeed:	250,
			preload: true,
			enableKeyboard:	true,
			closeOnEnd: false,
			closeOnImgClick: false,
			closeOnDockClick: true,
			closeOnEscKey: true, // quit when Esc key is pressed
			/*previousTarget: function(){
				return this.previousTargetDefault();
			},
			previousTargetDefault: function(){
				var targetIndex = $targets.index(target) - 1;
				if(targetIndex < 0){
					if(options.closeOnEnd === true){
						close();
						return false;
					}
					else{
						targetIndex = $targets.length - 1;
					}
				}
				target = $targets.eq(targetIndex);
			},
			nextTarget: function(){
				return this.nextTargetDefault();
			},
			nextTargetDefault: function(){
				var targetIndex = $targets.index(target)+1;
				if(targetIndex >= $targets.length){
					if(options.closeOnEnd === true){
						close();
						return false;
					}
					else{
						targetIndex = 0;
					}
				}
				target = $targets.eq(targetIndex);
			}*/
		},
		open: function(){
			if(this.isOpen){
				return;
			}
			this.isOpen = true;
			this._trigger('open');
			this._loadImage();
			this._bindListeners();
		},
		close: function(){
			if(this.currentImage === null){
				return false;
			}
			var self = this;

			this.currentImage.animate({ opacity: 0 }, this.options.animationSpeed, function(){
				self._removeImage();
				self._unbindListeners();
				self.inProgress = false;
				self._trigger('close');
			});
		},
		previous: function(){
			var targetIndex = this.$targets.index(this.currentTarget)-1;
			if(targetIndex < 0){
				if(this.options.closeOnEnd === true){
					this.close();
					return;
				}
				else{
					targetIndex = this.$targets.length-1;

				}
			}
			this.currentTarget = this.$targets.eq(targetIndex);

			this._loadImage('left');
			this._trigger('previous', this.currentTarget);
		},
		next: function(){
			var targetIndex = this.$targets.index(this.currentTarget)+1;
			if(targetIndex >= this.$targets.length){
				if(this.options.closeOnEnd === true){
					this.close();
					return;
				}
				else{
					targetIndex = 0;
				}
			}
			this.currentTarget = this.$targets.eq(targetIndex);
			this._loadImage('right');
			this._trigger('next', this.currentTarget);
		},
		add: function(selector){
			/*selector.each(function(){
				if(!isTargetValid(this)){ return true; }
				$targets = $targets.add($(this));
			});
			selector.click(this.startImageLightbox);
			return this;*/
			console.log("ADDING ELEMENTS", selector);
		},
		remove: function(selector){
			console.log("REMOVING ELEMENTS", selector);
		},
		destroy: function(){
			console.log("DESTROY ME!");
     		this.$selector.data('select2').destroy();
			this._unbindListeners();
			this.$selector.off('click', this._onClick.bind(this));
		},
		at: function(index){
			var tmpTarget = this.$targets.eq(index);
			if(tmpTarget.length){
				var currentIndex = this.$targets.index(this.currentTarget);
				this.currentTarget = tmpTarget;
				this._loadImage(index < currentIndex ? 'left' : 'right');
			}
		},
		_init: function(){
			var self = this;
			console.log(this.$selector);
			this.$selector.each(function(i,sel){
				console.log(sel, i);
				if(self._isValidTarget(sel)){
					self.$targets = self.$targets.add($(sel));
				}
				else{
					console.log("Not valid target", sel);
				}
			});
			console.log("targets:", this.$targets);

			this.$selector.on('click', this._onClick.bind(this)).data('imageLightbox', this);
			this._trigger('init');
		},
		_setImage: function(){
			if(this.currentImage === null) return;

			var self = this,
				screenWidth = $(window).width() * 0.8,
				screenHeight = $(window).height() * 0.9,
				tmpImage = new Image();

			tmpImage.src = this.currentImage.attr('src');
			tmpImage.onload = function(){
				self.imageWidth = tmpImage.width;
				self.imageHeight = tmpImage.height;

				if(self.imageWidth > screenWidth || self.imageHeight > screenHeight){
					var ratio = self.imageWidth / self.imageHeight > screenWidth / screenHeight ? self.imageWidth / screenWidth : self.imageHeight / screenHeight;
					self.imageWidth /= ratio;
					self.imageHeight /= ratio;
				}

				self.currentImage.css({
					width: self.imageWidth+'px',
					height: self.imageHeight+'px',
					top: ($(window).height() - self.imageHeight)/2+'px',
					left: ($(window).width() - self.imageWidth)/2+'px'
				});
			};
		},
		_loadImage: function(direction){
			if(this.inProgress){
				return false;
			}
			var self = this;

			direction = typeof direction === 'undefined' ? false : direction === 'left' ? 1 : -1;

			if(this.currentImage !== null){
				var params = { opacity: 0 };
				if(this.hasTransitionSupport){
					this._translateX(this.currentImage, (100 * direction) - this.swipeDiff+'px', this.options.animationSpeed / 1000);
				}
				else{
					params.left = parseInt(this.currentImage.css('left'))+100 * direction+'px';
				}
				this.currentImage.animate(params, this.options.animationSpeed, function(){ self._removeImage(); });
				this.swipeDiff = 0;
			}

			this.inProgress = true;
			this._trigger('load:start', this.currentTarget);

			console.log('load:start', this.currentTarget);

			setTimeout(function(){
				var imgPath = self.currentTarget.attr('href');
				if(imgPath === undefined){
					imgPath = self.currentTarget.attr('data-lightbox');
				}
				self.currentImage = $('<img id="'+self.options.lightboxID+'" />').attr('src', imgPath).load(function(){
					self.currentImage.appendTo('body');
					self._setImage();

					var params = { opacity: 1 };

					self.currentImage.css('opacity', 0);
					if(self.hasTransitionSupport)
					{
						self._translateX(self.currentImage, -100 * direction+'px', 0);
						setTimeout(function(){
							self._translateX(self.currentImage, 0+'px', self.options.animationSpeed / 1000);
						}, 50);
					}
					else
					{
						var imagePosLeft = parseInt(self.currentImage.css('left'));
						params.left = imagePosLeft+'px';
						self.currentImage.css('left', imagePosLeft - 100 * direction+'px');
					}

					self.currentImage.animate(params, self.options.animationSpeed, function(){
						self.inProgress = false;
						self._trigger('load:complete', this.currentTarget)
					});

					if(self.options.preloadNext){
						var nextTarget = self.$targets.eq(self.$targets.index(self.currentTarget)+1);
						if(!nextTarget.length){
							nextTarget = self.$targets.eq(0);
						}
						$('<img />').attr('src', nextTarget.attr('href')).load();
					}
				}).error(function(){
					self._trigger('load:error', this.currentTarget);
				});

				var swipeStart = 0,
					swipeEnd = 0,
					imagePosLeft = 0;

				self.currentImage.on(self.hasPointers ? 'pointerup MSPointerUp' : 'click', function(e){
					e.preventDefault();
					if(self.options.closeOnImgClick){
						self.close();
						return false;
					}
					if(self._wasTouched(e.originalEvent)){
						return true;
					}
					var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
					if(self.imageWidth / 2 > posX){
						self.previous();
					}
					else{
						self.next();
					}
				}).on('touchstart pointerdown MSPointerDown', function(e){
					if(!self._wasTouched(e.originalEvent) || self.options.closeOnImgClick){
						return true;
					}
					if(self.hasTransitionSupport){
						imagePosLeft = parseInt(self.currentImage.css('left'));
					}
					swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
				}).on('touchmove pointermove MSPointerMove', function(e){
					if(!self._wasTouched(e.originalEvent) || self.options.closeOnImgClick){
						return true;
					}
					e.preventDefault();
					swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[ 0 ].pageX;
					self.swipeDiff = swipeStart - swipeEnd;
					if(self.hasTransitionSupport){
						self._translateX(self.currentImage, -self.swipeDiff+'px', 0);
					}
					else{
						self.currentImage.css('left', imagePosLeft - self.swipeDiff+'px');
					}
				}).on('touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function(e){
					if(!self._wasTouched(e.originalEvent) || self.options.closeOnImgClick){
						return true;
					}
					if(Math.abs(self.swipeDiff) > 50){
						if(self.swipeDiff < 0){
							self.previous();
						}
						else{
							self.next();
						}
					}
					else{
						if(self.hasTransitionSupport){
							self._translateX(self.currentImage, 0+'px', self.options.animationSpeed / 1000);
						}
						else{
							self.currentImage.animate({ left: imagePosLeft+'px' }, self.options.animationSpeed / 2);
						}
					}
				});
			}, this.options.animationSpeed+100);
		},
		_isValidTarget: function(element){
			var classic = $(element).prop('tagName').toLowerCase() === 'a' && (new RegExp('('+this.options.allowedTypes+')$', 'i')).test($(element).attr('href'));
			var html5 = $(element).attr('data-lightbox') !== undefined;
			return classic || html5;
		},
		_translateX: function(element, positionX, speed){
			var options = {}, prefix = this._cssTransitionSupport();
			options[prefix+'transform'] = 'translateX('+positionX+')';
			options[prefix+'transition'] = prefix+'transform '+speed+'s linear';
			element.css(options);
		},
		_removeImage: function(){
			if(this.currentImage === null){
				return false;
			}
			this.currentImage.remove();
			this.currentImage = null;
		},
		_on: function(event, callback){
			this.listeners = this.listeners || {};

			if(event in this.listeners){
				this.listeners[event].push(callback);
			}
			else {
				this.listeners[event] = [callback];
			}
		},
		_trigger: function(event){
			var slice = Array.prototype.slice;

			this.listeners = this.listeners || {};

			if(event in this.listeners){
				this._invoke(this.listeners[event], slice.call(arguments, 1));
			}
			if('*' in this.listeners){
				this._invoke(this.listeners['*'], arguments);
			}
		},
		_invoke: function(listeners, params){
			for(var i = 0, len = listeners.length; i < len; i++){
				listeners[i].apply(this, params);
			}
		},
		_wasTouched: function(event){
			if(this.hasTouch){
				return true;
			}

			if(!this.hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined'){
				return false;
			}

			if(typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined'){
				if(event.MSPOINTER_TYPE_MOUSE !== event.pointerType){
					return true;
				}
			}
			else if(event.pointerType !== 'mouse'){
				return true;
			}
			return false;
		},
		_bindListeners: function(){
			var self = this;

			$(window).on('resize', this._setImage.bind(this));

			if(this.options.closeOnDockClick){
				// $(document).on(this.hasTouch ? 'touchend' : 'click', this._closeOnClick.bind(this));
				$(document).on('click', this._closeOnClick.bind(this));
			}
			if(this.options.enableKeyboard){
				$(document).on('keyup', this._onKeyUp.bind(this));
			}
		},
		_unbindListeners: function(){
			$(window).off('resize', this._setImage);
			$(document).off('click', this._closeOnClick);
			$(document).off('keyup', this._onKeyUp);
		},
		_onClick: function(e){
			e.preventDefault();
			if(this.inProgress){
				return;
			}
			this.currentTarget = $(e.currentTarget);
			this.open();
		},
		_closeOnClick: function(e){
			if(this.isOpen && !$(e.target).is(this.currentImage)){
				this.close();
			}
		},
		_onKeyUp: function(e){
			e.preventDefault();
			if(e.keyCode === 27 && this.options.closeOnEscKey === true){
				this.close();
			}
			else if(e.keyCode === 37){
				this.previous();
			}
			else if(e.keyCode === 39){
				this.next();
			}
		},
		_cssTransitionSupport: function(){
			var s = document.body || document.documentElement;
			s = s.style;
            if(s.WebkitTransition === ''){ return '-webkit-'; }
            if(s.MozTransition === ''){ return '-moz-'; }
            if(s.OTransition === ''){ return '-o-'; }
            if(s.transition === ''){ return ''; }
			return false;
		}
	});


	return ImageLightbox;
	/*
	if($.fn.imageLightbox == null){
		var thisMethods = ['destroy', 'add', 'remove', 'open', 'close', 'at'];

		$.fn.imageLightbox = function(options){
			options = options || {};
			if(typeof options === 'object'){
				this.each(function(){
					var instanceOptions = $.extend({}, options, true);
					console.log($(this));
					var instance = new ImageLightbox($(this), instanceOptions);
				});

				return this;
			}
			else if(typeof options === 'string'){
				var instance = this.data('imageLightbox');

				if(instance == null && window.console && console.error){
					console.error('The imageLightbox(\''+options+'\') method was called on an element that is not using imageLightbox.');
				}

				var args = Array.prototype.slice.call(arguments, 1);

				var ret = instance[options](args);

				if($.inArray(options, thisMethods) > -1){
					return this;
				}
				return ret;
			}
			else {
				throw new Error('Invalid arguments for imageLightbox: '+options);
			}
		};
	}*/
});