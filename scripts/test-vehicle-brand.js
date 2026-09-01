'use strict';

const assert = require('node:assert/strict');
const { validVehicleBrand } = require('../api/appointments')._test;

assert.equal(validVehicleBrand('Volkswagen'), true);
assert.equal(validVehicleBrand('Audi'), true);
assert.equal(validVehicleBrand('BMW', 'BMW'), true);
assert.equal(validVehicleBrand('Mercedes-Benz', 'Mercedes-Benz'), true);
assert.equal(validVehicleBrand('Renault', ''), false);
assert.equal(validVehicleBrand('<script>', '<script>'), false);
assert.equal(validVehicleBrand('A', 'A'), false);

console.log('vehicle-brand validation tests passed');
