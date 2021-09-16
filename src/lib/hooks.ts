type Hook = (...params: any) => void;

class Hooks {
  public async execWorkflow(...hooks: Hook[]): Promise<Error | void> {
    for (const hook of hooks) {
      try {
        await hook();
      } catch (error) {
        throw new Error(`[execWorkflow] error: ${error.message}`);
      }
    }
  }
}

export default Hooks;
