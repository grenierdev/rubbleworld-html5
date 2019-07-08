import 'mocha';
import { expect } from 'chai';
import { Scene, Entity } from '../Scene';
import { TransformComponent, EmptyPrefab } from './Transform';
import { Vector3 } from '../math/Vector3';
import { Quaterion } from '../math/Quaterion';
import { Matrix4 } from '../math/Matrix4';
import { DEG2RAD } from '../math/util';
import { Euler } from '../math/Euler';

describe('TransformComponent', () => {
	it('constructor', async () => {
		const A = new TransformComponent();
		expect(A.localPosition.equals(Vector3.Zero)).to.equal(true);
		expect(A.localScale.equals(Vector3.One)).to.equal(true);
		expect(A.localRotation.equals(Euler.Zero)).to.equal(true);
		expect(
			A.localMatrix.equals(
				new Matrix4().compose(
					Vector3.Zero,
					Quaterion.Identity,
					Vector3.One
				)
			)
		).to.equal(true);
	});
	it('local matrix changes on update', async () => {
		const A = new TransformComponent();
		const scene = new Scene().addChild(new Entity('A').addComponent(A));

		const pos = new Vector3();
		const rot = new Quaterion();
		const sca = new Vector3();

		A.localMatrix.decompose(pos, rot, sca);
		expect(pos.equals(Vector3.Zero)).to.equal(true);

		A.localPosition.x = 10;

		let stepper = scene.update();

		expect(stepper.next().done).to.equal(false); // onStart
		expect(stepper.next().done).to.equal(false); // onUpdate
		A.localMatrix.decompose(pos, rot, sca);
		expect(pos.equals(A.localPosition)).to.equal(true);
	});
	it('world matrix changes on update', async () => {
		const A = new TransformComponent();
		const B = new TransformComponent();
		const scene = new Scene().addChild(
			new Entity('A').addComponent(A).addChild(new Entity('B').addComponent(B))
		);

		const pos = new Vector3();
		const rot = new Quaterion();
		const sca = new Vector3();

		A.localPosition.x = 10;
		B.localPosition.x = 10;

		let stepper = scene.update();

		expect(stepper.next().done).to.equal(false); // A#onStart
		expect(stepper.next().done).to.equal(false); // A#onUpdate
		expect(stepper.next().done).to.equal(false); // B#onStart
		expect(stepper.next().done).to.equal(false); // B#onUpdate
		A.worldMatrix.decompose(pos, rot, sca);
		expect(pos.equals(new Vector3(10, 0, 0))).to.equal(true);
		B.worldMatrix.decompose(pos, rot, sca);
		expect(pos.equals(new Vector3(20, 0, 0))).to.equal(true);
	});
	it('empty entity reset matrices chain', async () => {
		const A = new TransformComponent();
		const C = new TransformComponent();
		const scene = new Scene().addChild(
			new Entity('A')
				.addComponent(A)
				.addChild(new Entity('B').addChild(new Entity('C').addComponent(C)))
		);

		const pos = new Vector3();
		const rot = new Quaterion();
		const sca = new Vector3();

		A.localPosition.x = 10;
		C.localPosition.x = 10;

		let stepper = scene.update();

		expect(stepper.next().done).to.equal(false); // A#onStart
		expect(stepper.next().done).to.equal(false); // A#onUpdate
		expect(stepper.next().done).to.equal(false); // B#onStart
		expect(stepper.next().done).to.equal(false); // B#onUpdate
		A.worldMatrix.decompose(pos, rot, sca);
		expect(pos.equals(new Vector3(10, 0, 0))).to.equal(true);
		C.worldMatrix.decompose(pos, rot, sca);
		expect(pos.equals(new Vector3(10, 0, 0))).to.equal(true);
	});
	it('get axis vectors', async () => {
		const v = new Vector3();

		const A = new TransformComponent();
		const B = new TransformComponent();
		const scene = new Scene().addChild(
			new Entity('A').addComponent(A).addChild(new Entity('B').addComponent(B))
		);

		A.localRotation.x = 180 * DEG2RAD;
		B.localPosition.x = 10;

		B.getForwardVector(v);
		expect(v.x).to.approximately(0, Number.EPSILON);
		expect(v.y).to.approximately(0, Number.EPSILON);
		expect(v.z).to.approximately(1, Number.EPSILON);
		B.getRightVector(v);
		expect(v.x).to.approximately(1, Number.EPSILON);
		expect(v.y).to.approximately(0, Number.EPSILON);
		expect(v.z).to.approximately(0, Number.EPSILON);
		B.getUpVector(v);
		expect(v.x).to.approximately(0, Number.EPSILON);
		expect(v.y).to.approximately(1, Number.EPSILON);
		expect(v.z).to.approximately(0, Number.EPSILON);

		let stepper = scene.update();
		expect(stepper.next().done).to.equal(false); // A#willMount
		expect(stepper.next().done).to.equal(false); // B#willMount
		expect(stepper.next().done).to.equal(false); // A#update
		expect(stepper.next().done).to.equal(false); // B#update

		B.getForwardVector(v);
		expect(v.x).to.approximately(0, Number.EPSILON);
		expect(v.y).to.approximately(0, Number.EPSILON);
		expect(v.z).to.approximately(-1, Number.EPSILON);
		B.getRightVector(v);
		expect(v.x).to.approximately(1, Number.EPSILON);
		expect(v.y).to.approximately(0, Number.EPSILON);
		expect(v.z).to.approximately(0, Number.EPSILON);
		B.getUpVector(v);
		expect(v.x).to.approximately(0, Number.EPSILON);
		expect(v.y).to.approximately(-1, Number.EPSILON);
		expect(v.z).to.approximately(0, Number.EPSILON);
	});
});
