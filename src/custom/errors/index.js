import config from '../../config';

export default class MainError extends Error {
  constructor(message, severity, status) {
    // Calling parent constructor of base Error class.
    super(message);

    const severityCleaned = severity.toLowerCase();

    if (!(severityCleaned === 'debug' || severityCleaned === '7' || severityCleaned === 7) && config.environment === 'production') {
      // todo: Send emails to developers if in production.
      // todo: Mail config string(s) in config
      Error.captureStackTrace(this, this.constructor);
    }

    switch (severityCleaned) {
      case 0:
      case '0':
      case 'emerg':
        this.name = 'Emergency';
        break;
      case 1:
      case '1':
      case 'alert':
        this.name = 'Alert';
        break;
      case 2:
      case '2':
      case 'crit':
        this.name = 'Critical';
        break;
      case 3:
      case '3':
      case 'error':
      case '': // default
        this.name = 'Error';
        break;
      case 4:
      case '4':
      case 'warning':
        this.name = 'Warning';
        break;
      case 5:
      case '5':
      case 'notice':
        this.name = 'Notice';
        break;
      case 6:
      case '6':
      case 'info':
        this.name = 'Info';
        break;
      case 7:
      case '7':
      case 'debug':
        this.name = 'Debug';
        break;
      default:
        this.name = severity || this.constructor.name;
    }
    this.status = status || 500;
  }
}
