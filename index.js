
// Setup
moment.locale('it');

const app = new Vue({
	el: 'main',
	data: {
		monthOffset: 0,
		localizedMessage: '* Today *'
	},
	created() {
		this.monthOffset = moment().date(0).day();
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

// This function is called every second
function updateClock() {
	// Calendar Label
	const now = moment();
	app.localizedMessage = now.format('dddd D MMMM');

	const $clock = app.$el.querySelector('#clock');

	const $div = $clock.parentElement;
	$clock.width = $div.offsetWidth;
	$clock.height = $div.offsetHeight;

	const { width, height } = $clock;
	const radius = Math.min(width, height) / 2 - 20;

	const ctx = $clock.getContext('2d');
	ctx.translate(width / 2, height / 2);

	// Rendering Code

	ctx.strokeStyle = '#222';
	ctx.fillStyle = '#222';

	drawNumbers(ctx, radius);

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