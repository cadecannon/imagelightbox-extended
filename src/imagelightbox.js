define(['jquery'], function($){

	var ImageLightbox = function($element, options){
		if($element.data('imageLightbox') != null){
			$element.data('imageLightbox').destroy();
		}

		this.isOpen = false;
		this.inProgress = false;
		this.currentImage = null;
		this.hasTransitionSupport = this._cssTransitionsSupported();
		this.hasTouch = ('ontouchstart' in window),
		this.hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
		this.listeners = {};
		this.els = [];

		this.options = $.extend(this.defaults, options);

		/*$(window).on('resize', this.setImage);

		if(this.options.quitOnDocClick){
			// fix the bug , using the opera (moblie) and wechat. 
			//$(document).on('click', function(e)
			// $(document).on(hasTouch ? 'touchend' : 'click', function(e){
				//e.preventDefault();
				//if(image.length && !$(e.target).is(image)){ close(); }
			//});
		}

		if(options.enableKeyboard){
			$(document).on('keyup', function(e){
				if(!image.length){ return true; }
				e.preventDefault();
				if(e.keyCode === 27 && options.quitOnEscKey === true){ close(); }
				if(e.keyCode === 37){
					previous();
				} else if(e.keyCode === 39){
					next();
				}
			});
		}*/
		$(this.selector).off('click').on('click', this.onClick.bind(this));

		$.each(this.selector, function(i,el){
			els.push($(el));
		});

		$element.data('imageLightbox', this);
	};

	ImageLightbox.prototype.extend({
		defaults: {
			selector:		'id="imagelightbox"',
			allowedTypes:	'png|jpg|jpeg||gif', // add support for generated images without an extension
			animationSpeed:	250,
			prenext:	true,
			enableKeyboard:	true,
			quitOnEnd:		false,
			quitOnImgClick: false,
			quitOnDocClick: true,
			quitOnEscKey:   true, // quit when Esc key is pressed
			previousTarget: function(){
				return this.previousTargetDefault();
			},
			previousTargetDefault: function(){
				var targetIndex = targets.index(target) - 1;
				if(targetIndex < 0){
					if(options.quitOnEnd === true){
						close();
						return false;
					}
					else{
						targetIndex = targets.length - 1;
					}
				}
				target = targets.eq(targetIndex);
			},
			nextTarget: function(){
				return this.nextTargetDefault();
			},
			nextTargetDefault: function(){
				var targetIndex = targets.index(target)+1;
				if(targetIndex >= targets.length){
					if(options.quitOnEnd === true){
						close();
						return false;
					}
					else{
						targetIndex = 0;
					}
				}
				target = targets.eq(targetIndex);
			}
		},
		setImage: function(){
			if(this.currentImage === null) return;

			var self = this,
				screenWidth = $(window).width() * 0.8,
				screenHeight = $(window).height() * 0.9,
				tmpImage = new Image();

			tmpImage.src = this.currentImage.attr('src');
			tmpImage.onload = function(){
				imageWidth = tmpImage.width;
				imageHeight = tmpImage.height;

				if(imageWidth > screenWidth || imageHeight > screenHeight){
					var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
					imageWidth /= ratio;
					imageHeight /= ratio;
				}

				self.currentImage.css({
					width: imageWidth+'px',
					height: imageHeight+'px',
					top: ($(window).height() - imageHeight)/2+'px',
					left: ($(window).width() - imageWidth)/2+'px'
				});
			};
		},
		loadImage: function(direction){
			if(this.inProgress){
				return false;
			}
			var self = this;

			direction = typeof direction === 'undefined' ? false : direction === 'left' ? 1 : -1;

			if(this.currentImage !== null){
				var params = { opacity: 0 };
				if(this.hasTransitionSupport){ 
					this.translateX(this.currentImage, (100 * direction) - swipeDiff+'px', this.options.animationSpeed / 1000);
				}
				else{
					params.left = parseInt(this.currentImage.css('left'))+100 * direction+'px';
				}
				this.currentImage.animate(params, this.options.animationSpeed, function(){ self.removeImage(); });
				swipeDiff = 0;
			}

			this.inProgress = true;
			this.trigger('load:start');

			setTimeout(function(){
				var imgPath = target.attr('href');
				if(imgPath === undefined){
					imgPath = target.attr('data-lightbox');
				}
				self.currentImage = $('<img '+options.selector+' />').attr('src', imgPath).load(function(){
					self.currentImage.appendTo('body');
					self.setImage();

					var params = { opacity: 1 };

					self.currentImage.css('opacity', 0);
					if(hasTransitionSupport)
					{
						self.translateX(self.currentImage, -100 * direction+'px', 0);
						setTimeout(function(){ 
							self.translateX(self.currentImage, 0+'px', self.options.animationSpeed / 1000);
						}, 50);
					}
					else
					{
						var imagePosLeft = parseInt(self.currentImage.css('left'));
						params.left = imagePosLeft+'px';
						self.currentImage.css('left', imagePosLeft - 100 * direction+'px');
					}

					self.currentImage.animate(params, options.animationSpeed, function(){
						self.inProgress = false;
						self.trigger('load:complete', this.currentTarget)
					});

					if(self.options.prenext)
					{
						var nextTarget = targets.eq(targets.index(target)+1);
						if(!nextTarget.length){ 
							nextTarget = targets.eq(0);
						}
						$('<img />').attr('src', nextTarget.attr('href')).load();
					}
				}).error(function(){
					self.trigger('load:error', this.currentTarget);
				});

				var swipeStart = 0,
					swipeEnd = 0,
					imagePosLeft = 0;

				self.currentImage.on(self.hasPointers ? 'pointerup MSPointerUp' : 'click', function(e){
					e.preventDefault();
					if(self.options.quitOnImgClick){
						self.close();
						return false;
					}
					if(self.wasTouched(e.originalEvent)){ 
						return true;
					}
					var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
					if(imageWidth / 2 > posX){
						self.previous();
					}
					else{
						self.next();
					}
				}).on('touchstart pointerdown MSPointerDown', function(e){
					if(!self.wasTouched(e.originalEvent) || self.options.quitOnImgClick){ 
						return true;
					}
					if(isCssTransitionSupport){
						imagePosLeft = parseInt(self.currentImage.css('left'));
					}
					swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
				}).on('touchmove pointermove MSPointerMove', function(e){
					if(!self.wasTouched(e.originalEvent) || self.options.quitOnImgClick){
						return true;
					}
					e.preventDefault();
					swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[ 0 ].pageX;
					swipeDiff = swipeStart - swipeEnd;
					if(isCssTransitionSupport){
						self.translateX(self.currentImage, -swipeDiff+'px', 0);
					}
					else{
						self.currentImage.css('left', imagePosLeft - swipeDiff+'px');
					}
				}).on('touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function(e){
					if(!self.wasTouched(e.originalEvent) || self.options.quitOnImgClick){
						return true;
					}
					if(Math.abs(swipeDiff) > 50){
						if(swipeDiff < 0){
							self.previous();
						}
						else{
							self.next();
						}
					}
					else{
						if(isCssTransitionSupport){
							cssTransitionTranslateX(image, 0+'px', self.options.animationSpeed / 1000);
						}
						else{
							self.currentImage.animate({ 'left': imagePosLeft+'px' }, self.options.animationSpeed / 2);
						}
					}
				});
			}, self.options.animationSpeed+100);
		},
		previous: function(){
			this.loadImage('left');
		},
		next: function(){
			this.loadImage('right');
		},
		removeImage: function(){
			if(this.currentImage === null){
				return false;
			}
			this.currentImage.remove();
			this.currentImage = null;
		},
		onClick: function(e){
			e.preventDefault();
			if(this.inProgress){
				return;
			}
			this.currentImage = $(e.currentTarget);
			this.open();
		},
		open: function(){
			if(this.isOpen){
				return;
			}
			this.trigger('open');
			this.loadImage();
		},
		close: function(){
			if(this.currentImage === null){
				return false;
			}
			var self = this;

			this.currentImage.animate({ opacity: 0 }, this.options.animationSpeed, function(){
				self.removeImage();
				self.inProgress = false;
				self.trigger('close');
			});
		},
		on: function(event, callback){
			this.listeners = this.listeners || {};

			if(event in this.listeners){
				this.listeners[event].push(callback);
			}
			else {
				this.listeners[event] = [callback];
			}
		},
		trigger: function(event){
			var slice = Array.prototype.slice;

			this.listeners = this.listeners || {};

			if(event in this.listeners){
				this.invoke(this.listeners[event], slice.call(arguments, 1));
			}
			if('*' in this.listeners){
				this.invoke(this.listeners['*'], arguments);
			}
		},
		invoke: function(listeners, params){
			for(var i = 0, len = listeners.length; i < len; i++){
				listeners[i].apply(this, params);
			}
		},
		at: function(index){
			var tmpTarget = this.els[index];
			if(tmpTarget.length){
				var currentIndex = targets.index(target);
				target = tmpTarget;
				loadImage(index < currentIndex ? 'left' : 'right');
			}
			return this;
		};
		translateX = function(element, positionX, speed){
			var options = {}, prefix = cssTransitionSupport();
			options[prefix+'transform'] = 'translateX('+positionX+')';
			options[prefix+'transition'] = prefix+'transform '+speed+'s linear';
			element.css(options);
		},
		/*wasTouched	= function(event){
			if(hasTouch){ return true; }

			if(!hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined'){ return false; }

			if(typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined'){
				if(event.MSPOINTER_TYPE_MOUSE !== event.pointerType){ return true; }
			}
			else if(event.pointerType !== 'mouse'){
				return true;
			}
			return false;
		};*/
		_bindListeners: function(){

		},
		_unbindListeners: function(){
			var self = this;

			$(window).on('resize', this.setImage);

			if(this.options.quitOnDocClick){
				// fix the bug , using the opera (moblie) and wechat. 
				//$(document).on('click', function(e)
				// $(document).on(hasTouch ? 'touchend' : 'click', function(e){
					//e.preventDefault();
					//if(image.length && !$(e.target).is(image)){ close(); }
				//});
			}
			if(this.options.enableKeyboard){
				$(document).on('keyup', function(e){
					e.preventDefault();
					if(e.keyCode === 27 && self.options.quitOnEscKey === true){ 
						self.close();
					}
					else if(e.keyCode === 37){
						self.previous();
					}
					else if(e.keyCode === 39){
						self.next();
					}
				});
			}
		},
		_cssTransitionsSupported = function(){
			var s = document.body || document.documentElement;
			s = s.style;
			if(s.WebkitTransition === ''){ return true; }
			if(s.MozTransition === ''){ return true; }
			if(s.OTransition === ''){ return true; }
			if(s.transition === ''){ return true; }
			return false;
		},
	});
	 
	if($.fn.imageLightbox == null){
		var thisMethods = ['destroy'];

		$.fn.imageLightbox = function(options){
			options = options || {};
			if(typeof options === 'object'){
				this.each(function(){
					var instanceOptions = $.extend({}, options, true);

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
	}
});


	/*var cssTransitionSupport = function(){
			var s = document.body || document.documentElement;
			s = s.style;
			if(s.WebkitTransition === ''){ return '-webkit-'; }
			if(s.MozTransition === ''){ return '-moz-'; }
			if(s.OTransition === ''){ return '-o-'; }
			if(s.transition === ''){ return ''; }
			return false;
		},
		isCssTransitionSupport = cssTransitionSupport() !== false,
		cssTransitionTranslateX = function(element, positionX, speed){
			var options = {}, prefix = cssTransitionSupport();
			options[prefix+'transform'] = 'translateX('+positionX+')';
			options[prefix+'transition'] = prefix+'transform '+speed+'s linear';
			element.css(options);
		},
		hasTouch = ('ontouchstart' in window),
		hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
		wasTouched	= function(event){
			if(hasTouch){ return true; }

			if(!hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined'){ return false; }

			if(typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined'){
				if(event.MSPOINTER_TYPE_MOUSE !== event.pointerType){ return true; }
			}
			else if(event.pointerType !== 'mouse'){
				return true;
			}
			return false;
		};

	var ImageLightbox = function(opts){
		var options = $.extend({
				selector:		'id="imagelightbox"',
				allowedTypes:	'png|jpg|jpeg||gif', // add support for generated images without an extension
				animationSpeed:	250,
				prenext:	true,
				enableKeyboard:	true,
				quitOnEnd:		false,
				quitOnImgClick: false,
				quitOnDocClick: true,
				quitOnEscKey:   true, // quit when Esc key is pressed
				onStart:		false,
				onEnd:			false,
				onLoadStart:	false,
				onLoadEnd:		false,
				previousTarget: function(){
					return this.previousTargetDefault();
				},
				previousTargetDefault: function(){
					var targetIndex = targets.index(target) - 1;
					if(targetIndex < 0){
						if(options.quitOnEnd === true){
							close();
							return false;
						}
						else{
							targetIndex = targets.length - 1;
						}
					}
					target = targets.eq(targetIndex);
				},
				nextTarget: function(){
					return this.nextTargetDefault();
				},
				nextTargetDefault: function(){
					var targetIndex = targets.index(target)+1;
					if(targetIndex >= targets.length){
						if(options.quitOnEnd === true){
							close();
							return false;
						}
						else{
							targetIndex = 0;
						}
					}
					target = targets.eq(targetIndex);
				}
			},
			opts),
			targets		= $([]),
			target		= $(),
			image		= $(),
			imageWidth	= 0,
			imageHeight = 0,
			swipeDiff	= 0,
			inProgress	= false,
			isTargetValid = function(element){
				var classic = $(element).prop('tagName').toLowerCase() === 'a' && (new RegExp('('+options.allowedTypes+')$', 'i')).test($(element).attr('href'));
				var html5 = $(element).attr('data-lightbox') !== undefined;
				return classic || html5;
			},

			setImage = function(){
				if(!image.length){ return true; }

				var screenWidth = $(window).width() * 0.8,
					screenHeight = $(window).height() * 0.9,
					tmpImage = new Image();

				tmpImage.src = image.attr('src');
				tmpImage.onload = function(){
					imageWidth = tmpImage.width;
					imageHeight = tmpImage.height;

					if(imageWidth > screenWidth || imageHeight > screenHeight){
						var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
						imageWidth /= ratio;
						imageHeight /= ratio;
					}

					image.css({
						width: imageWidth+'px',
						height: imageHeight+'px',
						top: ($(window).height() - imageHeight)/2+'px',
						left: ($(window).width() - imageWidth)/2+'px'
					});
				};
			},

			loadImage = function(direction){
				if(inProgress){ return false; }

				direction = typeof direction === 'undefined' ? false : direction === 'left' ? 1 : -1;

				if(image.length){
					var params = { 'opacity': 0 };
					if(isCssTransitionSupport){ cssTransitionTranslateX(image, (100 * direction) - swipeDiff+'px', options.animationSpeed / 1000); }
					else { params.left = parseInt(image.css('left'))+100 * direction+'px'; }
					image.animate(params, options.animationSpeed, function(){ removeImage(); });
					swipeDiff = 0;
				}

				inProgress = true;
				if(options.onLoadStart !== false){ options.onLoadStart(target); }

				setTimeout(function(){
					var imgPath = target.attr('href');
					if(imgPath === undefined){
						imgPath = target.attr('data-lightbox');
					}
					image = $('<img '+options.selector+' />')
						.attr('src', imgPath)
						.load(function(){
							image.appendTo('body');
							setImage();

							var params = { 'opacity': 1 };

							image.css('opacity', 0);
							if(isCssTransitionSupport)
							{
								cssTransitionTranslateX(image, -100 * direction+'px', 0);
								setTimeout(function(){ cssTransitionTranslateX(image, 0+'px', options.animationSpeed / 1000); }, 50);
							}
							else
							{
								var imagePosLeft = parseInt(image.css('left'));
								params.left = imagePosLeft+'px';
								image.css('left', imagePosLeft - 100 * direction+'px');
							}

							image.animate(params, options.animationSpeed, function()
							{
								inProgress = false;
								if(options.onLoadEnd !== false){ options.onLoadEnd(target); }
							});
							if(options.prenext)
							{
								var nextTarget = targets.eq(targets.index(target)+1);
								if(!nextTarget.length){ nextTarget = targets.eq(0); }
								$('<img />').attr('src', nextTarget.attr('href')).load();
							}
						})
						.error(function(){
							if(options.onLoadEnd !== false){ options.onLoadEnd(target) }
						});

					var swipeStart	 = 0,
						swipeEnd	 = 0,
						imagePosLeft = 0;

					image.on(hasPointers ? 'pointerup MSPointerUp' : 'click', function(e){
						e.preventDefault();
						if(options.quitOnImgClick){
							close();
							return false;
						}
						if(wasTouched(e.originalEvent)){ return true; }
						var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
						if(imageWidth / 2 > posX){
							previous();
						}
						else
						{
							next();
						}
					}).on('touchstart pointerdown MSPointerDown', function(e){
						if(!wasTouched(e.originalEvent) || options.quitOnImgClick){ return true; }
						if(isCssTransitionSupport){ imagePosLeft = parseInt(image.css('left')); }
						swipeStart = e.originalEvent.pageX || e.originalEvent.touches[ 0 ].pageX;
					}).on('touchmove pointermove MSPointerMove', function(e){
						if(!wasTouched(e.originalEvent) || options.quitOnImgClick){ return true; }
						e.preventDefault();
						swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[ 0 ].pageX;
						swipeDiff = swipeStart - swipeEnd;
						if(isCssTransitionSupport){ cssTransitionTranslateX(image, -swipeDiff+'px', 0); }
						else { image.css('left', imagePosLeft - swipeDiff+'px'); }
					}).on('touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function(e){
						if(!wasTouched(e.originalEvent) || options.quitOnImgClick){ return true; }
						if(Math.abs(swipeDiff) > 50){
							if(swipeDiff < 0){
								previous();
							}
							else{
								next();
							}
						}
						else{
							if(isCssTransitionSupport){ cssTransitionTranslateX(image, 0+'px', options.animationSpeed / 1000); }
							else { image.animate({ 'left': imagePosLeft+'px' }, options.animationSpeed / 2); }
						}
					});
				}, options.animationSpeed+100);
			},
			previous = function(){
				if(options.previousTarget() !== false){
					loadImage('left');
				}
			},
			next = function(){
				if(options.nextTarget() !== false){
					loadImage('right');
				}
			},
			removeImage = function(){
				if(!image.length){ return false; }
				image.remove();
				image = $();
			},
			close = function(){
				if(!image.length){ return false; }
				image.animate({ 'opacity': 0 }, options.animationSpeed, function(){
					removeImage();
					inProgress = false;
					if(options.onEnd !== false){ options.onEnd(); }
				});
			};

		$(window).on('resize', setImage);

		if(options.quitOnDocClick){
			// fix the bug , using the opera (moblie) and wechat. 
			/*$(document).on('click', function(e)
			// $(document).on(hasTouch ? 'touchend' : 'click', function(e){
				e.preventDefault();
				if(image.length && !$(e.target).is(image)){ close(); }
			});
		}

		if(options.enableKeyboard){
			$(document).on('keyup', function(e){
				if(!image.length){ return true; }
				e.preventDefault();
				if(e.keyCode === 27 && options.quitOnEscKey === true){ close(); }
				if(e.keyCode === 37){
					previous();
				} else if(e.keyCode === 39){
					next();
				}
			});
		}

		this.startImageLightbox = function(e){
			if(!isTargetValid(this)){ return true; }
			if(e !== undefined){ e.preventDefault(); }
			if(inProgress){ return false; }
			inProgress = false;
			if(options.onStart !== false){ options.onStart(); }
			target = $(this);
			loadImage();
		};

		$(document).off('click', this.selector);
		$(document).on('click', this.selector, this.startImageLightbox);

		$.each(function(){
			if(!isTargetValid(this)){ return true; }
			targets = targets.add($(this));
		});

		this.switchImageLightbox = function(index){
			var tmpTarget = targets.eq(index);
			if(tmpTarget.length){
				var currentIndex = targets.index(target);
				target = tmpTarget;
				loadImage(index < currentIndex ? 'left' : 'right');
			}
			return this;
		};

		this.previous = function(){
			previous();
		};

		this.next = function(){
			next();
		};

		this.quitImageLightbox = function(){
			close();
			return this;
		};
		// You can add the other targets to the image queue.
		this.addImageLightbox = function(elements){
			elements.each(function(){
				if(!isTargetValid(this)){ return true; }
				targets = targets.add($(this));
			});
			elements.click(this.startImageLightbox);
			return this;
		};
		this.removeImageLightbox = function(elements){
			console.log("REMOVING ELEMENTS");
		};
		this.destroyLightbox = function(){
			// Destroys this thing..
			console.log("DESTROY ME!");
		};
		return this;
	};*/