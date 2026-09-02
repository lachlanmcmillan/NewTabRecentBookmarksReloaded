import { render } from 'preact';
import { App } from './components/App/App';
import './global.css';
import './drag';

render(<App />, document.getElementById('app')!);
