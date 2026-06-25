import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Tasks() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">Organize and assign operational tasks</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Tasks view — coming soon. Share the design screenshot to build this out.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Tasks
