import * as path from 'path';

import * as express from 'express';

const app = express();

app.use(express.static(__dirname));

app.listen(4000, () => {
	console.log('Static server listening to http://localhost:4000/');
});