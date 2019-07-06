import 'mocha';
import { use, expect, should } from 'chai';
should();
import { Scene, Entity, Component } from './Scene';

describe('Scene', () => {
	it('update generator', async () => {
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
		expect(behA.count + behB.count + behC.count).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(2);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(3);

		// Update #2
		stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(4);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(5);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(6);
	});

	it('update generator interruption', async () => {
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
		expect(behA.count + behB.count + behC.count).to.equal(1);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(2);
		// Update #1 ignored

		// Update #2
		stepper = scene.update();
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(3);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(4);
		expect(stepper.next().done).to.equal(false);
		expect(behA.count + behB.count + behC.count).to.equal(5);
	});
});

class DummyComponent extends Component {
	count = 0;

	onUpdate() {
		this.count += 1;
	}
}
