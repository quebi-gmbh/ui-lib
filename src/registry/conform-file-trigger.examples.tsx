import { useForm } from "@conform-to/react"
import { parseWithValibot } from "@conform-to/valibot"
import * as v from "valibot"
import { Button } from "@/components/button"
import { ConformFileTrigger } from "@/components/conform-file-trigger"
import type { ComponentExample } from "./types"

const schema = v.object({
  // The hidden input carries real File objects, so the schema can look at size.
  avatar: v.pipe(
    v.file("Choose a file"),
    v.maxSize(2 * 1024 * 1024, "2 MB at most"),
  ),
})

const AvatarForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformFileTrigger
        field={fields.avatar}
        label="Avatar"
        description="PNG or JPEG, 2 MB at most."
        acceptedFileTypes={["image/png", "image/jpeg"]}
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

const galleySchema = v.object({
  shots: v.pipe(v.array(v.file()), v.minLength(1, "Add at least one image")),
})

const GalleryForm = () => {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: galleySchema })
    },
  })

  return (
    // biome-ignore lint/correctness/noRestrictedElements: documented exception — a form with no route action behind it. This demo validates and submits entirely in the browser (the gallery is a static site, so there is nothing to post to); in an app that has an action, this is <Form> from react-router. https://ui-lib.quebi.de/rules/no-raw-interactive-elements
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <ConformFileTrigger
        field={fields.shots}
        label="Screenshots"
        description="Drop them in, or browse."
        hasDropZone
        allowsMultiple
      />
      <Button type="submit" size="sm">
        Submit
      </Button>
    </form>
  )
}

export const conformFileTriggerExamples: ComponentExample[] = [
  {
    title: "Bound to a Conform form",
    description: "Submit with nothing chosen to see the validation error wired from field metadata.",
    render: () => <AvatarForm />,
  },
  {
    title: "With a drop zone",
    description: "One variant covers the button and the drop surface; both write the same input.",
    render: () => <GalleryForm />,
  },
]
