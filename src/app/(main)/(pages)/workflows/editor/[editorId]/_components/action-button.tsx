import React, { useCallback, useMemo } from 'react';
import { Option } from './content-based-on-title';
import { ConnectionProviderProps } from '@/providers/connections-provider';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { postContentToWebHook } from '@/app/(main)/(pages)/connections/_actions/discord-connection';
import { onCreateNodeTemplate } from '../../../_actions/workflow-connections';
import { toast } from 'sonner';
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection';
import { postMessageToSlack } from '@/app/(main)/(pages)/connections/_actions/slack-connection';

type Props = {
    currentService: string;
    nodeConnection: ConnectionProviderProps;
    channels?: Option[];
    setChannels?: (value: Option[]) => void;
};

const ActionButton = ({
    currentService,
    nodeConnection,
    channels,
    setChannels
}: Props) => {
    const pathname = usePathname();

    const onSendDiscordMessage = useCallback(async () => {
        const response = await postContentToWebHook(
            nodeConnection.discordNode.content,
            nodeConnection.discordNode.webhookURL
        );

        if (response.message == 'success') {
            nodeConnection.setDiscordNode((prev: any) => ({
                ...prev,
                content: ''
            }));
        }
    }, [nodeConnection.discordNode]);

    const onStoreNotionContent = useCallback(async () => {
        console.log(
            nodeConnection.notionNode.databaseId,
            nodeConnection.notionNode.accessToken,
            nodeConnection.notionNode.content
        );
        const response = await onCreateNewPageInDatabase(
            nodeConnection.notionNode.databaseId,
            nodeConnection.notionNode.accessToken,
            nodeConnection.notionNode.content
        );
        if (response) {
            nodeConnection.setNotionNode((prev: any) => ({
                ...prev,
                content: ''
            }));
        }
    }, [nodeConnection.notionNode]);

    const onStoreSlackContent = useCallback(async () => {
        const response = await postMessageToSlack(
            nodeConnection.slackNode.slackAccessToken,
            channels!,
            nodeConnection.slackNode.content
        );
        if (response.message == 'Success') {
            toast.success('Message sent successfully');
            nodeConnection.setSlackNode((prev: any) => ({
                ...prev,
                content: ''
            }));
            setChannels!([]);
        } else {
            toast.error(response.message);
        }
    }, [nodeConnection.slackNode, channels]);

    const serviceMap = useMemo(
        () => ({
            Discord: {
                content: nodeConnection.discordNode.content,
                accessToken: undefined,
                databaseId: undefined,
                channels: undefined
            },
            Notion: {
                content: JSON.stringify(nodeConnection.notionNode.content),
                accessToken: nodeConnection.notionNode.accessToken,
                databaseId: nodeConnection.notionNode.databaseId,
                channels: undefined
            },
            Slack: {
                content: nodeConnection.slackNode.content,
                accessToken: nodeConnection.slackNode.slackAccessToken,
                databaseId: undefined,
                channels: channels
            }
        }),
        [channels, nodeConnection]
    );

    const onCreateLocalNodeTemplate = useCallback(async () => {
        const service = serviceMap[currentService];

        if (!service) {
            return;
        }

        const response = await onCreateNodeTemplate(
            service.content,
            currentService,
            pathname.split('/').pop()!,
            service.channels,
            service.accessToken,
            service.databaseId
        );

        if (response) {
            toast.message(response);
        }
    }, [currentService, pathname, serviceMap]);

    const actionButtonMap = {
        Discord: {
            action: onSendDiscordMessage,
            label: 'Test Message'
        },
        Notion: {
            action: onStoreNotionContent,
            label: 'Test'
        },
        Slack: {
            action: onStoreSlackContent,
            label: 'Send Message'
        }
    };

    const renderActionButton = () => {
        const actionButton = actionButtonMap[currentService];

        if (!actionButton) {
            return null;
        }

        return (
            <>
                <Button variant="outline" onClick={actionButton.action}>
                    {actionButton.label}
                </Button>
                <Button variant="outline" onClick={onCreateLocalNodeTemplate}>
                    Save Template
                </Button>
            </>
        );
    };

    return renderActionButton();
};

export default ActionButton;
