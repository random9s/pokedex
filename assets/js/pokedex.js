(function(w, d) {
	'use strict';

	class Pokedex {
		constructor() {
			this.poke = d.getElementById('pokedex');
			this.leftside = d.getElementById('pokedex_outer_left');
			this.viewport = d.getElementById('pokedex-viewport');
			this.shadow = d.getElementById('shadow');
			this.fetchPromise = this.fetchPokemon();

			this.poke.addEventListener('animationend', e => {
				//override closed classes with open classes
				this.poke.classList.remove('pokedex__wrap');
				this.poke.classList.add('pokedex__wrap_open');

				this.leftside.classList.remove('pokedex__outer');
				this.leftside.classList.add('pokedex__outer_open');

				this.shadow.classList.remove('pokedex__shadow');
				this.shadow.classList.add('pokedex__shadow_open');

				this.fetchPromise.then(entries => {
					this.openPokedex();
				}).catch( err => {
					console.log ('Caught error fetching pokemon: ', err);
				});
			});
		}

		switchActive(e) {
			let elem = e.target;
			this.active.classList.remove('selected');

			//unfortunate hack to mousing over children elements
			if (!elem.id) elem = elem.parentNode;
			elem.classList.add('selected');
			this.active = elem;
		}

		successPokeFetch(e, resolve) {
			if (e && e.responseText) {
				let data = JSON.parse(e.responseText);
				this.pokeData = data.results;
				let entries = data.results.map((item, index) => {
					var id = 'poke-' + index;
					index++;

					if (index < 10) index = '00' + index;
					else if (index >= 10 && index < 100) index = '0' + index;

					return EL('div', {
						id: id,
						classList: ['pokedex__entry'],
						events: { mouseover: e => { this.switchActive(e); }, click: e => { this.switchActive(e) } },
						children: [
							span(index),
							span(item.name)
						]
					});
				});

				entries[0].classList.add('selected');
				this.entries = entries;
				this.active = entries[0];
				resolve(entries);
			}
		}

		loadData(e) {
			if (!this.viewingData) {
				this.viewingData = true;

				this.oldPokeview = document.getElementById('pokeview');
				let pokeEntry = (Number(this.active.id.split('poke-')[1])) + 1;

				this.pokeviewParent = this.oldPokeview.parentNode;
				this.pokeviewParent.removeChild(this.oldPokeview);
				this.newPokeview = EL('div', { classList: ['pokedex__view_left'], children: [
					EL('img', {
						id: `poke-img-${pokeEntry}`,
						classList: ['poke-img'],
						src: `assets/img/redblue/${pokeEntry}.png`
					}),
				]});

				this.pokeviewParent.appendChild(this.newPokeview);
			}
		}

		playCry(e) {
			let parent = e.target.parentNode;
			let pokeEntry = (Number(this.active.id.split('poke-')[1]));
			let pokemon = this.pokeData[pokeEntry].name;
			let cry = new Audio(`assets/audio/${pokemon}.mp3`);
			let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			this.createVisualWaveform(cry, audioCtx);

			cry.addEventListener('ended', () => {
				audioCtx.close().then(() => {
					cancelAnimationFrame(this.waveformAnimReq);
					let canvas = document.getElementById('poke-cry-waveform');
					let canvasCtx = canvas.getContext('2d');
					console.log (canvas.width, canvas.height);
					canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
					canvasCtx.beginPath();
				});
			});

			cry.play().catch(e => {
				console.log('error while playing pokemon cry ', e);
			});
		}

		createVisualWaveform(audio, audioCtx) {
			let canvas = document.getElementById('poke-cry-waveform');
			let canvasCtx = canvas.getContext('2d');

			let gainNode = audioCtx.createGain();
			let analyser = audioCtx.createAnalyser();
			let track = audioCtx.createMediaElementSource(audio);
			track.connect(analyser);
			track.connect(gainNode);
			gainNode.connect(audioCtx.destination);
			gainNode.gain.value = 0.35;

			analyser.fftSize = 2048;
			let bufferLength = analyser.frequencyBinCount;
			let dataArray = new Uint8Array(bufferLength);

			const WIDTH = canvas.width;
			const HEIGHT = canvas.height;
			canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

			const draw = function() {
				this.waveformAnimReq = requestAnimationFrame(draw);

				analyser.getByteTimeDomainData(dataArray);
				canvasCtx.fillStyle = 'rgb(101, 101, 101)';
				canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
				canvasCtx.lineWidth = 2;
				canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
				canvasCtx.beginPath();

				let sliceWidth = WIDTH * 1.0 / bufferLength;
				let x = 0

				for(let i = 0; i < bufferLength; i++) {
					let v = dataArray[i] / 128.0;
					let y = v * HEIGHT/2;

					if(i === 0) canvasCtx.moveTo(x, y);
					else canvasCtx.lineTo(x, y);

					x += sliceWidth;
				}

				canvasCtx.lineTo(WIDTH, HEIGHT/2);
				canvasCtx.stroke();
			}.bind(this);

			this.waveformAnimReq = requestAnimationFrame(draw);
		}

		quit(e) {
			if (this.viewingData) {
				this.pokeviewParent.removeChild(this.newPokeview);
				this.pokeviewParent.appendChild(this.oldPokeview);
				this.viewingData = false;
				this.active.scrollIntoView();
			}
		}

		fetchPokemon() {
			return new Promise((res, rej) => {

				let req = new HttpRequest('GET', {
					url: 'https://pokeapi.co/api/v2/pokemon?offset=0&limit=151',
					success: e => { this.successPokeFetch(e, res); },
					error: function(e) {
						console.log ('error occurred ' + e);
						rej(e);
					}
				});

				req.send();
			});
		}

		showNotRegistered(show) {
			let canvas = document.getElementById('poke-cry-waveform');
			let canvasCtx = canvas.getContext('2d');
			canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
			canvasCtx.beginPath();

			if (show) {
				canvasCtx.font = "13px pkmn_rbygscregular";
				canvasCtx.textAlign = "center";
				canvasCtx.fillText("Action Not Registered", canvas.width/2, canvas.height/2 + 5);
			}
		}

		openPokedex () {
			let poke = this.poke,
				entries = this.entries,
				viewport = this.viewport;

			setTimeout(function() {
				let viewEl = EL('div', { classList: ['pokedex__view'],
					children: [
						EL('div', { classList: ['pokedex__view_wrap'],
							children: [
								EL('div', { id: 'pokeview', classList: ['pokedex__view_left'], children: entries }),
								EL('div', { classList: ['pokedex__view_right'],
									children: [
										EL('div', { classList: ['pokedex__view_right_upper'],
											children: [
												EL('div', { classList: ['pokedex__view_right_upper_info'], children: [span('Seen'), span('151')] }),
												EL('div', { classList: ['pokedex__view_right_upper_info'], children: [span('Own'), span('42')] })
											]
										}),
										EL('div', { classList: ['pokedex__view_right_lower'],
											children: [
												span('Data', {
													id: 'poke-data',
													events: { click: e => { this.loadData(e); } }
												}),
												span('Cry', {
													id: 'poke-cry',
													events: { click: e => { this.playCry(e); } }
												}),
												span('Area'),
												span('Quit', {
													id: 'poke-quit',
													events: { click: e => { this.quit(e); } }
												})
											]
										}),
									]
								})
							]
						})
					]
				});

				let viewButtonsEl =  EL('div', { classList: ['pokedex__buttons_wrap'],
					children: [
						EL('div', { classList: ['pokedex__button_circle'] }),
						EL('div', { classList: ['pokedex__button_red_pill'] }),
						EL('div', { classList: ['pokedex__button_blue_pill'] }),
						EL('div', { classList: ['pokedex__button_d_pad_ud'] }),
						EL('div', { classList: ['pokedex__button_d_pad_lr'] })
					]
				});

				//Remove current viewport and replace with pokedex viewer
				while (viewport.firstChild)
					viewport.removeChild(viewport.lastChild);
				viewport.appendChild(viewEl);
				viewport.appendChild(viewButtonsEl);
			}.bind(this), 100);

			const buttonClicked = function(color) {
				return function (e) {
					if (e.type === 'mousedown' || e.type === 'touchstart') {
						e.target.classList.add(`pokedex__${color}_btn_clicked`);
						this.showNotRegistered(true);
					} else if (e.type === 'mouseup' || e.type === 'touchend') {
						e.target.classList.remove(`pokedex__${color}_btn_clicked`);
						this.showNotRegistered(false);
					}
				}.bind(this);
			}.bind(this);

			const makeButton = function (color) {
				return EL('div', {
					classList: [`pokedex__${color}_btn`],
					events: {
						mousedown: buttonClicked(color),
						mouseup: buttonClicked(color),
						touchstart: buttonClicked(color),
						touchend: buttonClicked(color)
					}
				});
			};

			setTimeout(function() {
				[
					EL('div', { classList: ['pokedex__outer_right_upper'],
						children: [
							EL('div', { classList: ['pokedex__right_left'] }),
							EL('div', { classList: ['pokedex__right_middle'] }),
							EL('div', { classList: ['pokedex__right_right'] })
						]
					}),
					EL('div', { classList: ['pokedex__outer_right_middle'] }),
					EL('div', { classList: ['pokedex__outer_right_middle2'] }),
					EL('div', { classList: ['pokedex__outer_right_lower'],
						children: [
							EL('div', { classList: ['pokedex__right_btn_wrap'],
								children: [
									EL('div', { classList: ['pokedex__btn_screen'] , children: [
										EL('canvas', { id: 'poke-cry-waveform', classList: ['pokedex__waveform'], width: 240, height: 50 })
									]}),
									EL('div', { classList: ['pokedex__btn_blue_btn_group'],
										children: [
											EL('div', { classList: ['pokedex__blue_btn_row'],
												children: [
													makeButton('blue'),
													makeButton('blue'),
													makeButton('blue'),
													makeButton('blue'),
													makeButton('blue'),
												]
											}),
											EL('div', { classList: ['pokedex__blue_btn_row'],
												children: [
													makeButton('blue'),
													makeButton('blue'),
													makeButton('blue'),
													makeButton('blue'),
													makeButton('blue'),
												]
											}),
										]
									}),
									EL('div', { classList: ['pokedex__btn_pills'],
										children: [
											EL('div', { classList: ['pokedex__pills'] }),
											EL('div', { classList: ['pokedex__pills'] })
										]
									}),
									EL('div', { classList: ['pokedex__btn_other'],
										children: [
											makeButton('white'),
											makeButton('white'),
											makeButton('yellow'),
										]
									}),
								]
							}),
						]
					}),
				].forEach(child => { poke.appendChild(child) });
			}, 50);
		}
	}

	new Pokedex ();
})(window, document);
