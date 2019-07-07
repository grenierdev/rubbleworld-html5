import 'mocha';
import { expect } from 'chai';
import { Scene, Entity, Component } from './Scene';

describe('Scene', () => {
	it('update iterator', async () => {
		const A = new DummyComponent();
		const scene = new Scene([new Entity('A', [A])]);

		let stepper = scene.update();

		// onStart
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(0);
		expect(A.lateUpdate).to.equal(0);

		// onUpdate
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);

		// onLateUpdate
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(1);

		expect(stepper.next().done).to.equal(true);
	});

	it('component entity order', async () => {
		const A = new DummyComponent();
		const B = new DummyComponent();
		const C = new DummyComponent();

		const scene = new Scene([
			new Entity('A', [A], [new Entity('B', [B])]),
			new Entity('C', [C]),
		]);

		let stepper = scene.update();

		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(0);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(0);
		expect(B.update).to.equal(0);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(0);
		expect(C.update).to.equal(0);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(0);
		expect(B.update).to.equal(0);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(0);
		expect(C.update).to.equal(0);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(0);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(0);
		expect(C.update).to.equal(0);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(0);
		expect(C.update).to.equal(0);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(1);
		expect(C.update).to.equal(0);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(1);
		expect(C.update).to.equal(1);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(1);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(C.start).to.equal(1);
		expect(C.update).to.equal(1);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(1);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(1);
		expect(C.start).to.equal(1);
		expect(C.update).to.equal(1);
		expect(C.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(1);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(1);
		expect(C.start).to.equal(1);
		expect(C.update).to.equal(1);
		expect(C.lateUpdate).to.equal(1);

		expect(stepper.next().done).to.equal(true);
	});

	it('component execution order', async () => {
		const A = new DummyComponent();
		const B = new PriorityComponent();

		const scene = new Scene([new Entity('A', [A]), new Entity('B', [B])]);

		let stepper = scene.update();

		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(0);
		expect(A.update).to.equal(0);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(0);
		expect(B.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(0);
		expect(A.update).to.equal(0);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(0);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(0);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(A.start).to.equal(1);
		expect(A.update).to.equal(1);
		expect(A.lateUpdate).to.equal(1);
		expect(B.start).to.equal(1);
		expect(B.update).to.equal(1);
		expect(B.lateUpdate).to.equal(1);
		expect(stepper.next().done).to.equal(true);
	});
});

class DummyComponent extends Component {
	start = 0;
	update = 0;
	lateUpdate = 0;

	onStart() {
		this.start += 1;
	}

	onUpdate() {
		this.update += 1;
	}

	onLateUpdate() {
		this.lateUpdate += 1;
	}
}

class PriorityComponent extends DummyComponent {
	public static executionOrder = -10;
}
