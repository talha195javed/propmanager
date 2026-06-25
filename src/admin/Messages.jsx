import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Messages() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Communicate with owners and tenants</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Messages view — coming soon. Share the design screenshot to build this out.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Messages
