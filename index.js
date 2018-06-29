
// Setup
moment.locale('it');
window.scrollTo(0, 1);

// Matchers

const Matcher = {};

Matcher.Word = word => ({
	match: it => it === word,
	extractor: it => undefined,
});

Matcher.Keyword = keyword => ({
	match: it => it === keyword,
	extractor: it => keyword,
});

Matcher.Time = {
	match: it => it.match(/\d?\d:\d\d(:\d\d)?/),
	extractor: it => moment(it, 'hh:mm:ss'),
};

Matcher.Color = {
	match: it => it.match(/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?/),
	extractor: it => it,
};

Matcher.Or = (list) => ({
	match: it => list.some(m => m.match(it)),
	extractor: it => list.find(m => m.match(it)).extractor(it),
});

Matcher.ClockHand = Matcher.Or(
	['hours', 'minutes', 'seconds'].map(hand => Matcher.Keyword(hand))
);

Matcher.DynamicTime = Matcher.Or([Matcher.Keyword('now'), Matcher.Time]);

// Command Definitions

const commands = [
	{
		trigger: [Matcher.Word('bar'), Matcher.Word('from'), Matcher.DynamicTime, Matcher.Word('to'), Matcher.DynamicTime, Matcher.Word('in'), Matcher.Color],
		handle: function ([from, to, color]) {
			if (from === 'now')
				from = moment();
			if (to === 'now')
				to = moment();
			
			this.bars.push({ from, to, color });
		}
	},
	// TODO: add bars not tied to only to hours
];

function processDefinitions(definitions) {
	const decorations = {
		bars: []
	};

	definitions.forEach(definition => {

		const words = definition.trim().split(' ');

		const command = commands.find(command => {
			if (command.trigger.length === words.length) {
				return command.trigger.every((m, i) => m.match(words[i]));
			}
			else {
				return false;
			}
		});

		if (command) {
			command.handle.call(decorations,
				words.map((word, i) => command.trigger[i].extractor(word)).filter(it => it !== undefined)
			);
		}
	});

	return decorations;
}

const app = new Vue({
	el: 'main',
	data: {
		monthOffset: 0,
		localizedMessage: '* Today *',
		field: ''
	},
	created() {
		this.monthOffset = moment().date(0).day();
		this.field = localStorage.getItem('datetime:field') || '';
	},
	watch: {
		field: function (value) {
			localStorage.setItem('datetime:field', value);
		}
	},
	methods: {
		getClockDecorations: function () {
			const definitions = this.field
				.split('\n')
				.filter(line => line.trim().length > 0);

			return processDefinitions(definitions);
		}
	}
});

function drawHand(ctx, pos, length, width) {
	ctx.beginPath();
	ctx.lineWidth = width;
	ctx.lineCap = "round";
	ctx.moveTo(0, 0);
	ctx.rotate(pos);
	ctx.lineTo(0, -length);
	ctx.stroke();
	ctx.rotate(-pos);
}

function drawNumbers(ctx, radius) {
	var ang;
	var num;
	ctx.font = radius * 0.10 + "px 'IBM Plex Mono'";
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	for (num = 1; num < 13; num++) {
		ang = num * Math.PI / 6;
		ctx.rotate(ang);
		ctx.translate(0, -radius);
		ctx.rotate(-ang);
		ctx.fillText(num.toString(), 0, 0);
		ctx.rotate(ang);
		ctx.translate(0, radius);
		ctx.rotate(-ang);
	}
}

function drawDecorations(ctx, radius) {
	const decorations = app.getClockDecorations();

	decorations.bars.forEach((bar, i) => {

		let hourFrom = bar.from.hours();
		hourFrom = hourFrom % 12;
		let minuteFrom = bar.from.minutes();
		minuteFrom = minuteFrom % 60;

		const angleFrom = (hourFrom * Math.PI / 6) + (minuteFrom * Math.PI / (6 * 60)) - Math.PI / 2;

		let hourTo = bar.to.hours();
		hourTo = hourTo % 12;
		let minuteTo = bar.to.minutes();
		minuteTo = minuteTo % 60;

		const angleTo = (hourTo * Math.PI / 6) + (minuteTo * Math.PI / (6 * 60)) - Math.PI / 2;

		ctx.beginPath();
		ctx.lineWidth = radius * 0.025;
		ctx.lineCap = "round";	
		ctx.strokeStyle = bar.color;
		ctx.arc(0, 0, radius * (0.915 - 0.03 * i), angleFrom, angleTo);
		ctx.stroke();

	});
}

// This function is called every second
function updateClock() {
	// Calendar Label
	const now = moment();
	app.localizedMessage = now.format('dddd D MMMM');

	const $clock = app.$el.querySelector('#clock');

	const $div = $clock.parentElement;
	$clock.width = $div.offsetWidth * 2;
	$clock.height = $div.offsetHeight * 2;

	$clock.style.width = $div.offsetWidth + 'px';
	$clock.style.height = $div.offsetHeight + 'px';

	const { width, height } = $clock;
	const radius = Math.min(width, height) / 2 * 0.95;

	const ctx = $clock.getContext('2d');

	ctx.resetTransform();
	ctx.translate(0.5, 0.5);

	ctx.translate(width / 2, height / 2);

	// Rendering Code

	ctx.strokeStyle = '#222';
	ctx.fillStyle = '#222';

	drawNumbers(ctx, radius);

	// Draw Bar Decorations
	drawDecorations(ctx, radius);

	// Draw Clock Hands

	ctx.strokeStyle = '#000';

	var hour = now.hours();
	var minute = now.minutes();
	var second = now.seconds();
	// hour
	hour = hour % 12;
	hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60)) + (second * Math.PI / (360 * 60));
	drawHand(ctx, hour, radius * 0.5, radius * 0.03);
	// minute
	minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
	drawHand(ctx, minute, radius * 0.8, radius * 0.03);
	// second
	second = (second * Math.PI / 30);
	drawHand(ctx, second, radius * 0.85, radius * 0.01);

}

setInterval(updateClock, 1000);
updateClock();