# Workflow Controller Usage Guide

The workflow controller orchestrates the entire smart contract deployment process, managing the step-by-step workflow from analysis through deployment.

## Overview

The workflow follows this sequence:
1. **Analyze** (optional) - AI security analysis
2. **Compile** - Solidity compilation
3. **Review** - Constructor arguments collection
4. **Deploy** - Contract deployment
5. **Done** - Completion

## Basic Usage

### Starting a Workflow

```typescript
import { workflowController } from '@/lib/workflowController';

// Start workflow with AI analysis enabled
await workflowController.startWorkflow(projectId, true);

// Start workflow without AI analysis
await workflowController.startWorkflow(projectId, false);
```

### Monitoring Workflow State

```typescript
import { useStore } from '@/lib/store';

// In a React component
const workflow = useStore((state) => state.workflow);

// Access workflow properties
const steps = workflow?.steps;
const currentStepIndex = workflow?.currentStepIndex;
const compilationResult = workflow?.compilationResult;
const deploymentResult = workflow?.deploymentResult;
```

### Handling Constructor Arguments

After compilation, if the contract has constructor arguments:

```typescript
// Get constructor arguments from workflow
const constructorArgs = workflow?.constructorArgs;

// Update argument values
const updatedArgs = [...constructorArgs];
updatedArgs[0].value = '100';
useStore.getState().setConstructorArgs(updatedArgs);

// Validate arguments
workflowController.validateConstructorArgs(updatedArgs);

// Complete review step
workflowController.completeReviewStep();
```

### Deploying the Contract

```typescript
// Deploy after constructor arguments are provided
await workflowController.runDeploymentStep();

// Access deployment result
const result = workflow?.deploymentResult;
console.log('Contract Address:', result?.contractAddress);
console.log('Transaction Hash:', result?.transactionHash);
```

### Resetting the Workflow

```typescript
// Reset workflow to start over
workflowController.resetWorkflow();
```

## Error Handling

All workflow methods throw errors that should be caught:

```typescript
try {
    await workflowController.startWorkflow(projectId, true);
} catch (error) {
    console.error('Workflow failed:', error.message);
    // Error is also stored in the workflow step
    const failedStep = workflow?.steps.find(s => s.status === 'failed');
    console.log('Failed step:', failedStep?.name);
    console.log('Error message:', failedStep?.errorMessage);
}
```

## Integration with UI Components

### WorkflowVisualizer

Display the current workflow state:

```typescript
import WorkflowVisualizer from '@/components/WorkflowVisualizer';

<WorkflowVisualizer
    steps={workflow.steps}
    currentStepIndex={workflow.currentStepIndex}
/>
```

### ConstructorArgumentsModal

Collect constructor arguments from the user:

```typescript
import ConstructorArgumentsModal from '@/components/ConstructorArgumentsModal';

<ConstructorArgumentsModal
    isOpen={showModal}
    abi={workflow.compilationResult.abi}
    arguments={workflow.constructorArgs}
    onArgumentChange={(index, value) => {
        const args = [...workflow.constructorArgs];
        args[index].value = value;
        useStore.getState().setConstructorArgs(args);
    }}
    onSubmit={async () => {
        workflowController.validateConstructorArgs(workflow.constructorArgs);
        workflowController.completeReviewStep();
        await workflowController.runDeploymentStep();
    }}
    onCancel={() => workflowController.resetWorkflow()}
/>
```

### DeploymentPanel

Display deployment results:

```typescript
import DeploymentPanel from '@/components/DeploymentPanel';

<DeploymentPanel
    isOpen={showPanel}
    contractAddress={workflow.deploymentResult.contractAddress}
    transactionHash={workflow.deploymentResult.transactionHash}
    networkName={selectedNetwork.name}
    explorerUrl={selectedNetwork.explorerUrl}
    timestamp={Date.now()}
    abi={workflow.compilationResult.abi}
    bytecode={workflow.compilationResult.bytecode}
    contractName={selectedProject.name}
    onClose={() => workflowController.resetWorkflow()}
/>
```

## Complete Example

See `components/WorkflowControlExample.tsx` for a complete working example that demonstrates:
- Starting the workflow
- Handling constructor arguments
- Deploying contracts
- Error handling
- UI integration

## Requirements Validation

The workflow controller validates:
- **Requirement 4.1**: AI analysis step is optional and can be enabled/disabled
- **Requirement 4.4**: Workflow can be paused for fixing issues
- **Requirement 4.5**: AI analysis can be skipped
- **Requirement 5.1**: Compilation step is executed
- **Requirement 6.2**: Constructor arguments are collected when needed
- **Requirement 7.1**: Deployment step is executed with proper validation

## State Management

The workflow controller integrates with Zustand store:
- Workflow state is stored in `useStore.getState().workflow`
- All workflow updates trigger store updates
- UI components can subscribe to workflow changes
- Deployment history is automatically saved on successful deployment
