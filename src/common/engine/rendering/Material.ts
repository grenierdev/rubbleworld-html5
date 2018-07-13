import { IDisposable } from '@konstellio/disposable';
import { Shader } from './Shader';
import { Mesh } from './Mesh';

export class Material implements IDisposable {

	private disposed: boolean;

	public readonly vertexShader: Shader;
	public readonly fragmentShader: Shader;
	public readonly program: WebGLProgram;

	public readonly attributeTypes: Map<string, string>;
	public readonly attributeLocations: Map<string, number>;
	public readonly attributes: Map<string, any>;
	
	public readonly uniformTypes: Map<string, string>;
	public readonly uniformLocations: Map<string, WebGLUniformLocation>;
	public readonly uniforms: Map<string, any>;

	constructor(
		public gl: WebGLRenderingContext,
		vertex: string | Shader,
		fragment: string | Shader
	) {
		this.disposed = false;

		this.vertexShader = typeof vertex === 'string' ? new Shader(gl, vertex, gl.VERTEX_SHADER) : vertex;
		this.fragmentShader = typeof fragment === 'string' ? new Shader(gl, fragment, gl.FRAGMENT_SHADER) : fragment;

		this.attributeTypes = new Map();
		this.attributeLocations = new Map();
		this.attributes = new Map();
		this.uniformTypes = new Map();
		this.uniformLocations = new Map();
		this.uniforms = new Map();

		this.program = gl.createProgram()!;
		gl.attachShader(this.program, this.vertexShader.shader);
		gl.attachShader(this.program, this.fragmentShader.shader);
		gl.linkProgram(this.program);

		const status = gl.getProgramParameter(this.program, gl.LINK_STATUS);
		if (!status) {
			throw new SyntaxError(`Could not load program : ${gl.getProgramInfoLog(this.program)}.`);
		}

		gl.detachShader(this.program, this.vertexShader.shader);
		gl.detachShader(this.program, this.fragmentShader.shader);

		const attrRegex = /attribute ([^ ]+) ([^ ;]+);/gi;
		const uniformRegex = /uniform ([^ ]+) ([^ ;]+);/gi;

		let matches: RegExpExecArray | null;
		while (matches = attrRegex.exec(this.vertexShader.source + this.fragmentShader.source)) {
			const [, type, name] = matches;
			this.attributeTypes.set(name, type.toLocaleLowerCase());
			this.attributeLocations.set(name, gl.getAttribLocation(this.program, name));
		}
		while (matches = uniformRegex.exec(this.vertexShader.source + this.fragmentShader.source)) {
			const [, type, name] = matches;
			this.uniformTypes.set(name, type.toLocaleLowerCase());
			this.uniformLocations.set(name, gl.getUniformLocation(this.program, name)!);
		}

		gl.useProgram(null);
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteProgram(this.program);
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	bind(): void {
		const gl = this.gl;

		gl.useProgram(this.program);
		for (const [name, value] of this.uniforms) {
			if (value) {
				const indx = this.uniformLocations.get(name)!;
				const type = this.uniformTypes.get(name)!;
				switch (type) {
					case 'int':
					case 'sampler':
					case 'sampler2d':
					case 'samplercube':
						gl.uniform1iv(indx, value); break;
					case 'int': gl.uniform1iv(indx, value); break;
					case 'ivec2': gl.uniform2iv(indx, value); break;
					case 'ivec3': gl.uniform3iv(indx, value); break;
					case 'ivec4': gl.uniform4iv(indx, value); break;
					case 'float': gl.uniform1fv(indx, value); break;
					case 'vec2': gl.uniform2fv(indx, value); break;
					case 'vec3': gl.uniform3fv(indx, value); break;
					case 'vec4': gl.uniform4fv(indx, value); break;
					case 'mat2': gl.uniformMatrix2fv(indx, false, value); break;
					case 'mat3': gl.uniformMatrix3fv(indx, false, value); break;
					case 'mat4': gl.uniformMatrix4fv(indx, false, value); break;
				}
			}
		}
	}

	drawMesh(mesh: Mesh): void {
		const gl = this.gl;
		if (this.attributeLocations.has('vertPosition')) {
			const indx = this.attributeLocations.get('vertPosition')!;
			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
			gl.vertexAttribPointer(indx, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(indx);
		}
		if (mesh.normalBuffer && this.attributeLocations.has('vertNormal')) {
			const indx = this.attributeLocations.get('vertNormal')!;
			gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
			gl.vertexAttribPointer(indx, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(indx);
		}
		for (let i = 0, l = mesh.uvsBuffer.length; i < l; ++i) {
			if (this.attributeLocations.has('vertUV' + (i + 1))) {
				const indx = this.attributeLocations.get('vertUV' + (i + 1))!;
				gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvsBuffer[i]);
				gl.vertexAttribPointer(indx, 2, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(indx);
			}
		}
		for (let i = 0, l = mesh.colorsBuffer.length; i < l; ++i) {
			if (this.attributeLocations.has('vertColor' + (i + 1))) {
				const indx = this.attributeLocations.get('vertColor' + (i + 1))!;
				gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorsBuffer[i]);
				gl.vertexAttribPointer(indx, 4, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(indx);
			}
		}
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indiceBuffer);

		gl.drawElements(gl.TRIANGLES, mesh.indiceCount, gl.UNSIGNED_SHORT, 0);
	}
}