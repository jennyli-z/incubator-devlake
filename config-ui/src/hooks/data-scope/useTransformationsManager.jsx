/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { useCallback, useState, useContext } from 'react'
import IntegrationsContext from '@/store/integrations-context'
// import { Providers } from '@/data/Providers'
import TransformationSettings from '@/models/TransformationSettings'
import { isEqual } from 'lodash'

// manage transformations in one place
const useTransformationsManager = () => {
  const { Providers, ProviderTransformations, Integrations } =
    useContext(IntegrationsContext)
  const [transformations, setTransformations] = useState({})

  const getDefaultTransformations = useCallback(
    (provider) => {
      // let transforms = {}
      const transforms = ProviderTransformations[provider] || {}
      // @note: Default Transformations configured in Plugin Registry! (see @src/registry/plugins)
      // switch (provider) {
      //   case Providers.GITHUB:
      //     transforms = {
      //       prType: '',
      //       prComponent: '',
      //       prBodyClosePattern: '',
      //       issueSeverity: '',
      //       issueComponent: '',
      //       issuePriority: '',
      //       issueTypeRequirement: '',
      //       issueTypeBug: '',
      //       issueTypeIncident: '',
      //       refdiff: null,
      //       productionPattern: '',
      //       deploymentPattern: ''
      //       // stagingPattern: '',
      //       // testingPattern: ''
      //     }
      //     break
      //   case Providers.JIRA:
      //     transforms = {
      //       epicKeyField: '',
      //       typeMappings: {},
      //       storyPointField: '',
      //       remotelinkCommitShaPattern: '',
      //       bugTags: [],
      //       incidentTags: [],
      //       requirementTags: [],
      //       // @todo: verify if jira utilizes deploy tag(s)?
      //       productionPattern: '',
      //       deploymentPattern: ''
      //       // stagingPattern: '',
      //       // testingPattern: ''
      //     }
      //     break
      //   case Providers.JENKINS:
      //     transforms = {
      //       productionPattern: '',
      //       deploymentPattern: ''
      //       // stagingPattern: '',
      //       // testingPattern: ''
      //     }
      //     break
      //   case Providers.GITLAB:
      //     transforms = {
      //       productionPattern: '',
      //       deploymentPattern: ''
      //       // stagingPattern: '',
      //       // testingPattern: ''
      //     }
      //     break
      //   case Providers.TAPD:
      //     // @todo: complete tapd transforms #2673
      //     transforms = {
      //       issueTypeRequirement: '',
      //       issueTypeBug: '',
      //       issueTypeIncident: '',
      //       productionPattern: '',
      //       deploymentPattern: ''
      //       // stagingPattern: '',
      //       // testingPattern: ''
      //     }
      //     break
      // }
      return transforms
    },
    [ProviderTransformations]
  )

  const generateKey = useCallback(
    (connectionProvider, connectionId, entity) => {
      let key = `not-distinguished`
      key = entity ? entity?.getConfiguredEntityId() : key
      console.info(
        '>> GENERATING TRANSFORMATION KEY FOR ENTITY...',
        connectionProvider,
        connectionId,
        entity,
        key,
        `${connectionProvider}/${connectionId}/${key}`
      )
      return `${connectionProvider}/${connectionId}/${key}`
    },
    []
  )

  // change some setting in specific connection's specific transformation
  const changeTransformationSettings = useCallback(
    (connectionProvider, connectionId, projectNameOrBoard, settings) => {
      const key = generateKey(
        connectionProvider,
        connectionId,
        projectNameOrBoard
      )
      console.info(
        '>> SETTING TRANSFORMATION SETTINGS PROJECT/BOARD...',
        key,
        settings
      )
      setTransformations((existingTransformations) => ({
        ...existingTransformations,
        [key]: new TransformationSettings({
          ...existingTransformations[key],
          ...settings
        })
      }))
    },
    [setTransformations, generateKey]
  )

  // set a default value for connection's specific transformation
  const initializeDefaultTransformation = useCallback(
    (connectionProvider, connectionId, projectNameOrBoard) => {
      const key = generateKey(
        connectionProvider,
        connectionId,
        projectNameOrBoard
      )
      console.info(
        '>> INIT DEFAULT TRANSFORMATION SETTINGS PROJECT/BOARD...',
        key
      )
      if (!transformations[key]) {
        setTransformations((old) => ({
          ...old,
          [key]: new TransformationSettings(
            getDefaultTransformations(connectionProvider)
          )
        }))
      }
    },
    [
      setTransformations,
      generateKey,
      getDefaultTransformations,
      transformations
    ]
  )

  // get specific connection's specific transformation
  const getTransformation = useCallback(
    (connectionProvider, connectionId, projectNameOrBoard) => {
      const key = generateKey(
        connectionProvider,
        connectionId,
        projectNameOrBoard
      )
      console.debug(
        '>> useTransformationsManager.getTransformation...',

        connectionProvider,
        connectionId,
        projectNameOrBoard
      )
      return transformations[key]
    },
    [transformations, generateKey]
  )

  // get provider's specific scope options
  // @todo: refactor "projectNameOrBoard" to "entity" in all areas
  const getTransformationScopeOptions = useCallback(
    (connectionProvider, projectNameOrBoard) => {
      const key = generateKey(connectionProvider, projectNameOrBoard)
      const plugin = Integrations.find((p) => p.id === connectionProvider)
      console.debug(
        '>> useTransformationsManager.getScopeOptions...',

        connectionProvider,
        projectNameOrBoard
      )
      return plugin &&
        typeof plugin?.getDefaultTransformationScopeOptions === 'function'
        ? plugin.getDefaultTransformationScopeOptions(projectNameOrBoard)
        : {}
    },
    [Integrations, generateKey]
  )

  // clear connection's transformation
  const clearTransformationSettings = useCallback(
    (connectionProvider, connectionId, projectNameOrBoard) => {
      if (!projectNameOrBoard) {
        return
      }
      const key = generateKey(
        connectionProvider,
        connectionId,
        projectNameOrBoard
      )
      console.info('>> CLEAR TRANSFORMATION SETTINGS PROJECT/BOARD...', key)
      setTransformations((existingTransformations) => ({
        ...existingTransformations,
        [key]: null
      }))
    },
    [setTransformations, generateKey]
  )

  // check connection's transformation is changed
  const checkTransformationHasChanged = useCallback(
    (connectionProvider, connectionId, projectNameOrBoard) => {
      const key = generateKey(
        connectionProvider,
        connectionId,
        projectNameOrBoard
      )
      const storedTransform = transformations[key]
      const defaultTransform = new TransformationSettings(
        getDefaultTransformations(connectionProvider)
      )
      console.debug(
        '>> useTransformationsManager.checkTransformationHasChanged ...',
        key,
        storedTransform,
        defaultTransform
      )
      return !isEqual(defaultTransform, storedTransform)
    },
    [transformations, generateKey, getDefaultTransformations]
  )

  return {
    getTransformation,
    getTransformationScopeOptions,
    changeTransformationSettings,
    initializeDefaultTransformation,
    clearTransformationSettings,
    checkTransformationHasChanged
  }
}

export default useTransformationsManager
