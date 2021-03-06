import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';

import { FormComponent, TextInput, CheckBoxInput, SelectInput, SubmitButton, Form } from './Form';

import * as Validate from './validate';

import * as Action from './actions';
import Expand from './Expand';
import Delete from './Delete';
import { $try, reformatDatetime } from './utils';


const ModelsTab = props => (
  <div>
    <Expand label="Create New Model" id="newModelExpander">
      <NewModelForm selectedProject={props.selectedProject} />
    </Expand>

    <ModelTable selectedProject={props.selectedProject} />
  </div>
);
ModelsTab.propTypes = {
  selectedProject: PropTypes.object
};

let NewModelForm = (props) => {
  const { fields,
          fields: { modelName, featureSet, modelType },
          error, handleSubmit } = props;

  const skModels = props.models;
  const selectModels = [];

  for (const key in skModels) {
    if ({}.hasOwnProperty.call(skModels, key)) {
      const model = skModels[key];
      selectModels.push({
        id: key,
        label: model.name
      });
    }
  }

  const featureSets = props.featureSets
                        .filter(fs => !Validate.isEmpty(fs.finished))
                        .map(fs => (
                          {
                            id: fs.id,
                            label: fs.name
                          }
                        ));

  const chosenModel = props.models[modelType.value];

  return (
    <Form onSubmit={handleSubmit} error={error}>
      <TextInput label="Model name (choose your own)" {...modelName} />

      <SelectInput
        label="Feature Set"
        options={featureSets} {...featureSet}
      />

      <SelectInput
        label="Model Type"
        options={selectModels} {...modelType}
      />

      <Expand label="Choose Model Parameters" id="modelParameterExpander">
        <Model model={chosenModel} {...fields} />
      </Expand>

      <SubmitButton label="Create Model" />
    </Form>
  );
};
NewModelForm.propTypes = {
  fields: React.PropTypes.object.isRequired,
  error: React.PropTypes.string,
  handleSubmit: React.PropTypes.func.isRequired,
  featureSets: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  models: React.PropTypes.object.isRequired
};

const mapStateToProps = function (state, ownProps) {
  const formState = state.form.newModel;
  const currentModelType = formState ? formState.modelType : null;
  const currentModelId = $try(() => formState.modelType.value) || 0;
  const currentModel = state.sklearnModels[currentModelId];
  const modelFields = currentModel.params.map(param => param.name);

  let fields = ['modelName', 'project', 'featureSet', 'modelType'];
  fields = fields.concat(modelFields);

  const paramDefaults = {};
  currentModel.params.map((param) => {
    paramDefaults[param.name] = (param.default === null) ? "None" : param.default;
  });

  const firstFeatureSet = state.featuresets.featuresetList[0];
  const firstFeatureSetID = firstFeatureSet ? firstFeatureSet.id : "";

  return {
    models: state.sklearnModels,
    projects: state.projects,
    featureSets: state.featuresets.featuresetList,
    fields,
    initialValues: {
      modelType: currentModelId,
      project: ownProps.selectedProject.id,
      featureSet: firstFeatureSetID,
      ...paramDefaults
    }
  };
};

const mapDispatchToProps = dispatch => (
  {
    onSubmit: form => dispatch(Action.createModel(form))
  }
);

const validate = Validate.createValidator({
  modelName: [Validate.required],
  featureSet: [Validate.required]
});

NewModelForm = reduxForm({
  form: 'newModel',
  fields: [],
  validate
}, mapStateToProps, mapDispatchToProps)(NewModelForm);


export const Model = (props) => {
  const style = {
  };

  const model = props.model;

  return (
    <div style={style}>
      <h3>{model.name}</h3>
    {model.params.map((param, idx) => {
      const pProps = props[param.name];
      if (param.type === 'bool') {
        return <CheckBoxInput key={idx} label={param.name} {...(pProps)} />;
      } else {
        return <TextInput key={idx} label={param.name} {...(pProps)} />;
      }
    })}
    </div>
  );
};
Model.propTypes = {
  model: React.PropTypes.object.isRequired
};


export let ModelTable = props => (
  <table className="table">
    <thead>
      <tr>
        <th>Name</th><th>Created</th><th>Status</th><th>Actions</th>
      </tr>

      {
        props.models.map((model) => {
          const done = model.finished;
          const status = done ? <td>Completed {reformatDatetime(model.finished)}</td> : <td>In progress</td>;

          return (
            <tr key={model.id}>
              <td>{model.name}</td>
              <td>{reformatDatetime(model.created)}</td>
              {status}
              <td><DeleteModel ID={model.id} /></td>
            </tr>
          ); })
      }

    </thead>
  </table>
);
ModelTable.propTypes = {
  models: PropTypes.arrayOf(PropTypes.object)
};

const mtMapStateToProps = (state, ownProps) => (
  {
    models: state.models.filter(
      model => (model.project === ownProps.selectedProject.id))
  }
);

ModelTable = connect(mtMapStateToProps)(ModelTable);


const dmMapDispatchToProps = dispatch => (
  { delete: id => dispatch(Action.deleteModel(id)) }
);

const DeleteModel = connect(null, dmMapDispatchToProps)(Delete);


export default ModelsTab;
