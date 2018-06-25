import 'mocha';
import { use, expect, should } from 'chai';
should();
import { Scene, Entity, Component } from './Scene';

describe('Scene', () => {

	it('update order', async () => {

		const compA = new DummyComponent();
		const compB = new DummyComponent();
		const compC = new DummyComponent();

		const scene = new Scene([
			new Entity([compA], [new Entity([compB])]),
			new Entity([compC])
		]);

		expect(compA.count).to.equal(0);
		expect(compB.count).to.equal(0);
		expect(compC.count).to.equal(0);

		// Update #1
		let stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(1);
		expect(compB.count).to.equal(0);
		expect(compC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(1);
		expect(compB.count).to.equal(1);
		expect(compC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(1);
		expect(compB.count).to.equal(1);
		expect(compC.count).to.equal(1);
		expect(stepper.next().done).to.equal(true);

		// Update #2
		stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(2);
		expect(compB.count).to.equal(1);
		expect(compC.count).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(2);
		expect(compB.count).to.equal(2);
		expect(compC.count).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(2);
		expect(compB.count).to.equal(2);
		expect(compC.count).to.equal(2);
		expect(stepper.next().done).to.equal(true);
	});

	it('update breaks', async () => {

		const compA = new DummyComponent();
		const compB = new DummyComponent();
		const compC = new DummyComponent();

		const scene = new Scene([
			new Entity([compA], [new Entity([compB])]),
			new Entity([compC])
		]);

		expect(compA.count).to.equal(0);
		expect(compB.count).to.equal(0);
		expect(compC.count).to.equal(0);

		// Update #1
		let stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(1);
		expect(compB.count).to.equal(0);
		expect(compC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(1);
		expect(compB.count).to.equal(1);
		expect(compC.count).to.equal(0);

		// Update #1 ignored

		// Update #2
		stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(2);
		expect(compB.count).to.equal(1);
		expect(compC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(2);
		expect(compB.count).to.equal(2);
		expect(compC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(compA.count).to.equal(2);
		expect(compB.count).to.equal(2);
		expect(compC.count).to.equal(1);
		expect(stepper.next().done).to.equal(true);
	});

});

class DummyComponent extends Component {

	count = 0

	onUpdate() {
		this.count += 1;
	}

}