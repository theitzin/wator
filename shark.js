Shark = function(seed,pos) {
	this.position = pos;
	this.velocity = new Vec2(0, 0);
	this.acceleration = new Vec2(0, 0);
	this.direction = new Vec2(Math.cos(seed*2*Math.PI), Math.sin(seed*2*Math.PI));

	this.interpolatorX = new Interpolator([this.position.x, 0, 0, this.position.x, 0]);
	this.interpolatorY = new Interpolator([this.position.y, 0, 0, this.position.y, 0]);
	this.interpolationStart = Date.now();

	this.dimensions = [20, 13, 35, 7, 23, 4, 24, 14]; // length / width of head, body, butt, tail
	this.colors = ['#9097a0', '#70757c', '#565b63'];
	this.animationtime = Math.random();
};

Shark.prototype.Draw = function(ctx) {

	// movement data processing
	var dataX = this.interpolatorX.Eval(this.InterpolationTime());
	var dataY = this.interpolatorY.Eval(this.InterpolationTime());

	this.position.set(dataX[0], dataY[0]);
	var tmp = new Vec2(dataX[1], dataY[1]);
	if (tmp.length2() > 1)
		this.direction.copy(tmp).normalize();

	var aTmp = new Vec2(dataX[1] - this.velocity.x, dataY[1] - this.velocity.y);
	this.acceleration.scale(0.9).add(aTmp.scale(0.1));
	var aTangential = this.acceleration.dot(this.direction);
	var aNormal = this.acceleration.dot(this.direction.ortho());
	this.velocity.set(dataX[1], dataY[1]);

	this.animationtime += 0.1 + Math.min(Math.abs(aTangential) / 50 + Math.abs(aNormal) / 20, 0.5);
	var scaledBodyLength = this.dimensions[1] - Math.abs(aNormal / 2);

	// anchor points
	var head = this.direction.clone().rotate(-Math.sin(this.animationtime) / 8 + aNormal / 40);
	var butt = this.direction.clone().scale(-1).rotate(Math.sin(this.animationtime) / 4);
	var tail = this.direction.clone().scale(-1).rotate(-Math.cos(this.animationtime) / 3);

	// body points
	var headTop = this.position.clone().addScaled(this.direction, scaledBodyLength).addScaled(head, this.dimensions[0]);
	var headRight = this.position.clone().addScaled(this.direction, scaledBodyLength).addScaled(head.ortho(), this.dimensions[1]);
	var headLeft = headRight.clone().addScaled(head.ortho(), -2*this.dimensions[1]);
	var bodyRight = this.position.clone().addScaled(this.direction.ortho(), this.dimensions[3]);
	var bodyLeft = this.position.clone().addScaled(this.direction.ortho(), -this.dimensions[3]);
	var buttRight = this.position.clone().addScaled(butt, this.dimensions[4]).addScaled(butt.ortho(), -this.dimensions[5]);
	var buttLeft = buttRight.clone().addScaled(butt.ortho(), 2*this.dimensions[5]);
	var tailRight = this.position.clone().addScaled(butt, this.dimensions[4]).addScaled(tail, this.dimensions[6]).addScaled(tail.ortho(), -this.dimensions[7]);
	var tailLeft = tailRight.clone().addScaled(tail.ortho(), 2*this.dimensions[7]);
	var tailMiddle = this.position.clone().addScaled(butt, this.dimensions[4]).addScaled(tail, this.dimensions[6] / 2);

	// drawing
	this.DrawShape(ctx, [headTop, headRight, bodyRight, headTop, headLeft, bodyLeft], this.colors[0]);
	this.DrawShape(ctx, [headTop, bodyRight, buttRight, tailMiddle, buttLeft, bodyLeft], this.colors[1]);
	this.DrawShape(ctx, [tailMiddle, tailRight, buttRight, tailMiddle, tailLeft, buttLeft], this.colors[2]);
};

Shark.prototype.UpdatePosition = function(x, y) {

	var dataX = this.interpolatorX.Eval(this.InterpolationTime());
	var dataY = this.interpolatorY.Eval(this.InterpolationTime());

	var acc = new Vec2(-dataX[2], -dataY[2]);
	acc.normalize().scale(100);

	this.interpolatorX = new Interpolator([dataX[0], dataX[1], acc.x, x, 0]);
	this.interpolatorY = new Interpolator([dataY[0], dataY[1], acc.y, y, 0]);
	this.interpolationStart = Date.now();
};

Shark.prototype.DrawShape = function(ctx, points, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	if (points.length != 0)
		ctx.moveTo(points[0].x, points[0].y);
	for (var i = 1; i < points.length; i++)
		ctx.lineTo(points[i].x, points[i].y);
	ctx.fill();
};

Shark.prototype.InterpolationTime = function() {
	var dt = Math.min(Math.max(Date.now() - this.interpolationStart, 0) / 2000, 1);
	return 1 - (1 - dt)*(1 - dt); //return -2*dt*dt*dt + 3*dt*dt;
};


// cubic interpolation for smooth movement

Interpolator = function(data) {

	var inverse = [	[3, 2, 1/2, -3, 1],
					[-4, -3, -1, 4, -1],
					[0, 0, 1/2, 0, 0],
					[0, 1, 0, 0, 0],
					[1, 0, 0, 0, 0]];

	this.coef = MatrixVectorMult(inverse, data);
};

Interpolator.prototype.Eval= function(t) {
	return [	(((this.coef[0]*t + this.coef[1])*t + this.coef[2])*t + this.coef[3])*t + this.coef[4], // positions
				((4*this.coef[0]*t + 3*this.coef[1])*t + 2*this.coef[2])*t + this.coef[3], // velocities
				(12*this.coef[0]*t + 6*this.coef[1])*t + 2*this.coef[2]]; // curvature

};

// utility stuff

function MatrixVectorMult(mat, vec) {
	result = [];
	for (var i = 0; i < mat.length; i++) {
		tmp = 0;
		for (var j = 0; j < vec.length; j++) {
			tmp += mat[i][j] * vec[j];
		}
		result.push(tmp);
	}
	return result;
}