import 'mocha';
import { expect } from 'chai';
import { Scene, Entity, Component } from './Scene';

describe('Scene', () => {
	it('update iterator', async () => {
		const A = new DummyComponent();
		const scene = new Scene([], [new Entity('A', [A])]);

		let stepper = scene.update({
			time: 0,
			deltaTime: 0,
			fixedTime: 0,
			fixedDeltaTime: 0,
			frameCount: 0,
			timeScale: 1,
		});

		function data() {
			return [A.mountCount, A.updateCount];
		}

		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1]);
		expect(stepper.next().done).to.equal(true);
	});

	it('component entity order', async () => {
		const A = new DummyComponent();
		const B = new DummyComponent();
		const C = new DummyComponent();

		const scene = new Scene([], [new Entity('A', [A], [new Entity('B', [B])]), new Entity('C', [C])]);

		let stepper = scene.update({
			time: 0,
			deltaTime: 0,
			fixedTime: 0,
			fixedDeltaTime: 0,
			frameCount: 0,
			timeScale: 1,
		});

		function data() {
			return [A.mountCount, A.updateCount, B.mountCount, B.updateCount, C.mountCount, C.updateCount];
		}

		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0, 0, 0, 0, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0, 1, 0, 0, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0, 1, 0, 1, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 0, 1, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 1, 1, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 1, 1, 1]);
		expect(stepper.next().done).to.equal(true);
	});

	it('component execution order', async () => {
		const A = new DummyComponent();
		const B = new PriorityComponent();
		const C = new PriorityComponent();

		const EA = new Entity('A', [A]);

		const scene = new Scene([], [EA, new Entity('B', [B])]);

		let stepper = scene.update({
			time: 0,
			deltaTime: 0,
			fixedTime: 0,
			fixedDeltaTime: 0,
			frameCount: 0,
			timeScale: 1,
		});

		function data() {
			return [A.mountCount, A.updateCount, B.mountCount, B.updateCount, C.mountCount, C.updateCount];
		}

		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0, 0, 0, 0, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0, 1, 0, 0, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 0, 1, 1, 0, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 1, 0, 0]);
		expect(stepper.next().done).to.equal(true);

		EA.addComponent(C);

		stepper = scene.update({
			time: 0,
			deltaTime: 0,
			fixedTime: 0,
			fixedDeltaTime: 0,
			frameCount: 0,
			timeScale: 1,
		});

		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 1, 1, 0]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 1, 1, 1]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 1, 1, 2, 1, 1]);
		expect(stepper.next().done).to.equal(false);
		expect(data()).to.eql([1, 2, 1, 2, 1, 1]);
		expect(stepper.next().done).to.equal(true);
	});
});

class DummyComponent extends Component {
	mountCount = 0;
	updateCount = 0;

	didMount() {
		this.mountCount += 1;
	}

	update() {
		this.updateCount += 1;
	}
}

class PriorityComponent extends DummyComponent {
	public readonly executionOrder = -10;
}
