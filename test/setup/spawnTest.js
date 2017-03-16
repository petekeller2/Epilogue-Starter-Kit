export default {
  /** @function
   * @name logging
   * @param {object} childProcess
   * @description For logging childProcess usage is server.js
   */
  logging(childProcess) {
    const oldSpawn = childProcess.spawn;

    function mySpawn() {
      return oldSpawn.apply(this, arguments);
    }

    childProcess.spawn = mySpawn;
  },
};
