import 'mocha';
import { use, expect, should } from 'chai';
should();
import { Scene, Entity, Component } from './Scene';

describe('Scene', () => {
	it('update order', async () => {
		const behA = new DummyComponent();
		const behB = new DummyComponent();
		const behC = new DummyComponent();

		const scene = new Scene([
			new Entity('A', [behA], [new Entity('B', [behB])]),
			new Entity('C', [behC]),
		]);

		expect(behA.count).to.equal(0);
		expect(behB.count).to.equal(0);
		expect(behC.count).to.equal(0);

		// Update #1
		let stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(1);
		expect(behB.count).to.equal(0);
		expect(behC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(1);
		expect(behB.count).to.equal(1);
		expect(behC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(1);
		expect(behB.count).to.equal(1);
		expect(behC.count).to.equal(1);
		expect(stepper.next().done).to.equal(true);

		// Update #2
		stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(2);
		expect(behB.count).to.equal(1);
		expect(behC.count).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(2);
		expect(behB.count).to.equal(2);
		expect(behC.count).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(2);
		expect(behB.count).to.equal(2);
		expect(behC.count).to.equal(2);
		expect(stepper.next().done).to.equal(true);
	});

	it('update breaks', async () => {
		const behA = new DummyComponent();
		const behB = new DummyComponent();
		const behC = new DummyComponent();

		const scene = new Scene([
			new Entity('A', [behA], [new Entity('B', [behB])]),
			new Entity('C', [behC]),
		]);

		expect(behA.count).to.equal(0);
		expect(behB.count).to.equal(0);
		expect(behC.count).to.equal(0);

		// Update #1
		let stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(1);
		expect(behB.count).to.equal(0);
		expect(behC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(1);
		expect(behB.count).to.equal(1);
		expect(behC.count).to.equal(0);

		// Update #1 ignored

		// Update #2
		stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(2);
		expect(behB.count).to.equal(1);
		expect(behC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(2);
		expect(behB.count).to.equal(2);
		expect(behC.count).to.equal(0);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count).to.equal(2);
		expect(behB.count).to.equal(2);
		expect(behC.count).to.equal(1);
		expect(stepper.next().done).to.equal(true);
	});
});

class DummyComponent extends Component {
	count = 0;

	onUpdate() {
		this.count += 1;
	}
}
